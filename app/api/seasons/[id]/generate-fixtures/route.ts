import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * The league is played as a single match day: every fixture happens on the
 * season's start date, back to back on one pitch — not one match a week.
 *
 * Kickoff times are staggered by the configured interval, and the running order
 * is chosen so a team rarely plays two slots back to back — everyone gets a
 * breather between games.
 */

// Nigeria is UTC+1 year round (no DST), so a kickoff typed as "15:00" is
// stored as 14:00Z and reads back as 15:00 for everyone in the league.
const LEAGUE_UTC_OFFSET_MINUTES = 60

/**
 * Circle-method round robin. Returns an array of rounds; within a round every
 * team appears exactly once, so fixtures played in round order interleave the
 * teams. An odd number of teams gets a bye (null) each round.
 */
type Team = { id: string; name: string }

function roundRobinRounds(teams: Team[]): Array<Array<[Team, Team]>> {
  const list: Array<Team | null> = [...teams]
  if (list.length % 2 !== 0) list.push(null)

  const n = list.length
  const rounds: Array<Array<[Team, Team]>> = []

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[Team, Team]> = []
    for (let i = 0; i < n / 2; i++) {
      const a = list[i]
      const b = list[n - 1 - i]
      if (a !== null && b !== null) pairs.push([a, b])
    }
    rounds.push(pairs)

    // Rotate everything except the first entry.
    const fixed = list[0]
    const rest = list.slice(1)
    rest.unshift(rest.pop() as Team | null)
    list.length = 0
    list.push(fixed, ...rest)
  }

  return rounds
}

type Pairing = { home: Team; away: Team }

/**
 * Reorder fixtures so consecutive matches share no team wherever possible.
 * Greedy: at each slot prefer a fixture whose teams did not play the previous
 * slot, breaking ties towards the teams with the most games still to play so
 * we do not paint ourselves into a corner at the end.
 */
function spaceOutFixtures(pairings: Pairing[]): Pairing[] {
  const remaining = [...pairings]
  const outstanding = new Map<string, number>()
  for (const p of pairings) {
    outstanding.set(p.home.id, (outstanding.get(p.home.id) || 0) + 1)
    outstanding.set(p.away.id, (outstanding.get(p.away.id) || 0) + 1)
  }

  const ordered: Pairing[] = []
  let previous: Pairing | null = null

  while (remaining.length > 0) {
    const rested = remaining.filter(
      (p) =>
        !previous ||
        (p.home.id !== previous.home.id &&
          p.home.id !== previous.away.id &&
          p.away.id !== previous.home.id &&
          p.away.id !== previous.away.id)
    )

    const pool = rested.length > 0 ? rested : remaining
    let best = pool[0]
    let bestScore = -1
    for (const p of pool) {
      const score =
        (outstanding.get(p.home.id) || 0) + (outstanding.get(p.away.id) || 0)
      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }

    ordered.push(best)
    remaining.splice(remaining.indexOf(best), 1)
    outstanding.set(best.home.id, (outstanding.get(best.home.id) || 0) - 1)
    outstanding.set(best.away.id, (outstanding.get(best.away.id) || 0) - 1)
    previous = best
  }

  return ordered
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: seasonId } = await params

    const settings = await prisma.settings.findFirst()
    const matchesPerSeason = settings?.matchesPerSeason || 1
    const kickoff = settings?.matchDayKickoff || '15:00'
    const intervalMinutes = settings?.matchIntervalMinutes || 30

    const groups = await prisma.group.findMany({
      where: { seasonId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' }
    })

    if (groups.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 teams to generate fixtures' },
        { status: 400 }
      )
    }

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      select: { startDate: true }
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Only clear fixtures that have not been played. Recorded results survive
    // a regenerate.
    await prisma.match.deleteMany({
      where: { seasonId, status: 'SCHEDULED' }
    })

    const [kickoffHour, kickoffMinute] = kickoff
      .split(':')
      .map((n: string) => parseInt(n, 10))

    // Match day = the season's start date, at the configured kickoff.
    const firstKickoff = new Date(
      Date.UTC(
        season.startDate.getUTCFullYear(),
        season.startDate.getUTCMonth(),
        season.startDate.getUTCDate(),
        Number.isFinite(kickoffHour) ? kickoffHour : 15,
        Number.isFinite(kickoffMinute) ? kickoffMinute : 0,
        0,
        0
      )
    )
    firstKickoff.setUTCMinutes(firstKickoff.getUTCMinutes() - LEAGUE_UTC_OFFSET_MINUTES)

    const fixtures: Array<{
      seasonId: string
      homeGroupId: string
      awayGroupId: string
      matchDate: Date
      status: 'SCHEDULED'
    }> = []

    const rounds = roundRobinRounds(groups)
    const pairings: Pairing[] = []

    for (let leg = 0; leg < matchesPerSeason; leg++) {
      // Alternate which side is at home on each additional leg.
      const swap = leg % 2 === 1
      for (const round of rounds) {
        for (const [a, b] of round) {
          pairings.push(swap ? { home: b, away: a } : { home: a, away: b })
        }
      }
    }

    spaceOutFixtures(pairings).forEach((p, slot) => {
      const matchDate = new Date(firstKickoff)
      matchDate.setUTCMinutes(matchDate.getUTCMinutes() + slot * intervalMinutes)

      fixtures.push({
        seasonId,
        homeGroupId: p.home.id,
        awayGroupId: p.away.id,
        matchDate,
        status: 'SCHEDULED'
      })
    })

    await prisma.match.createMany({ data: fixtures })

    return NextResponse.json({
      message: `Generated ${fixtures.length} fixtures for one match day`,
      fixturesCreated: fixtures.length,
      teams: groups.length,
      matchesPerSeason,
      kickoff,
      intervalMinutes
    })
  } catch (error) {
    console.error('Error generating fixtures:', error)
    return NextResponse.json(
      { error: 'Failed to generate fixtures' },
      { status: 500 }
    )
  }
}
