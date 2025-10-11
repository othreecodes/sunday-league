import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Generate round-robin fixtures where each team plays every other team
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

    // Get league settings
    const settings = await prisma.settings.findFirst()
    const matchesPerSeason = settings?.matchesPerSeason || 1

    // Get all groups in this season
    const groups = await prisma.group.findMany({
      where: { seasonId },
      select: { id: true, name: true }
    })

    if (groups.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 teams to generate fixtures' },
        { status: 400 }
      )
    }

    // Delete existing scheduled matches for this season
    await prisma.match.deleteMany({
      where: {
        seasonId,
        status: 'SCHEDULED'
      }
    })

    // Generate round-robin fixtures
    const fixtures: Array<{
      seasonId: string
      homeGroupId: string
      awayGroupId: string
      matchDate: Date
      status: string
    }> = []

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      select: { startDate: true }
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    let currentDate = new Date(season.startDate)
    let matchNumber = 0

    // Round-robin algorithm: each team plays every other team based on matchesPerSeason setting
    // For matchesPerSeason = 1: single round-robin
    // For matchesPerSeason = 2: double round-robin (home and away)
    // For matchesPerSeason > 2: multiple rounds with alternating home/away
    for (let round = 0; round < matchesPerSeason; round++) {
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          // Calculate match date (one match per week, on Sundays)
          const matchDate = new Date(currentDate)
          matchDate.setDate(matchDate.getDate() + (matchNumber * 7))

          // Set time to Sunday 3:00 PM
          matchDate.setHours(15, 0, 0, 0)
          const dayOfWeek = matchDate.getDay()
          const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
          matchDate.setDate(matchDate.getDate() + daysUntilSunday)

          // Alternate home/away for even rounds (0, 2, 4...) vs odd rounds (1, 3, 5...)
          const isHomeFirst = round % 2 === 0

          fixtures.push({
            seasonId,
            homeGroupId: isHomeFirst ? groups[i].id : groups[j].id,
            awayGroupId: isHomeFirst ? groups[j].id : groups[i].id,
            matchDate,
            status: 'SCHEDULED'
          })

          matchNumber++
        }
      }
    }

    // Create all fixtures
    await prisma.match.createMany({
      data: fixtures
    })

    const roundType = matchesPerSeason === 1
      ? 'single round-robin'
      : matchesPerSeason === 2
        ? 'double round-robin (home and away)'
        : `${matchesPerSeason} rounds`

    return NextResponse.json({
      message: `Fixtures generated successfully (${roundType})`,
      fixturesCreated: fixtures.length,
      teams: groups.length,
      matchesPerSeason
    })
  } catch (error) {
    console.error('Error generating fixtures:', error)
    return NextResponse.json(
      { error: 'Failed to generate fixtures' },
      { status: 500 }
    )
  }
}
