/**
 * Development seed — mirrors the shape of the live data (four colour teams,
 * a played season and an upcoming one) so every screen can be checked with
 * realistic content: standings, scorers, cards, fixtures and results.
 *
 * Never run against production. Used by docker-compose.dev.yml only.
 *
 *   docker compose -f docker-compose.dev.yml exec app npx tsx prisma/dev-seed.ts
 *
 * Sign in with  david / devadmin1  (admin)  or  tunde / devuser1  (member).
 * Override the admin password with DEV_ADMIN_PASSWORD.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PEOPLE = [
  { name: 'Obi David', nickname: 'david', role: 'ADMIN' as const },
  { name: 'Tunde Bakare', nickname: 'tunde', role: 'MEMBER' as const },
  { name: 'Chika Eze', nickname: 'chika', role: 'MEMBER' as const },
  { name: 'Femi Adeyemi', nickname: 'femi', role: 'REFEREE' as const },
  { name: 'Kola Ajayi', nickname: 'kola', role: 'MEMBER' as const },
  { name: 'Ada Okafor', nickname: 'ada', role: 'MEMBER' as const },
  { name: 'Seyi Balogun', nickname: 'seyi', role: 'MEMBER' as const },
  { name: 'Nnamdi Uche', nickname: 'nnamdi', role: 'MEMBER' as const },
  { name: 'Bola Ogun', nickname: 'bola', role: 'MEMBER' as const },
  { name: 'Emeka Nwosu', nickname: 'emeka', role: 'MEMBER' as const },
  { name: 'Yemi Sanni', nickname: 'yemi', role: 'MEMBER' as const },
  { name: 'Ifeanyi Obi', nickname: 'ifeanyi', role: 'MEMBER' as const }
]

const TEAMS = ['Red', 'Blue', 'Green', 'Purple']

async function main() {
  console.log('Resetting development data…')
  await prisma.card.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.matchPlayer.deleteMany()
  await prisma.match.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.season.deleteMany()
  await prisma.user.deleteMany()
  await prisma.settings.deleteMany()

  await prisma.settings.create({
    data: { id: 'default-settings', leagueName: 'Cowrywise FC', matchesPerSeason: 1 }
  })

  const adminPw = await bcrypt.hash(process.env.DEV_ADMIN_PASSWORD || 'devadmin1', 10)
  const memberPw = await bcrypt.hash('devuser1', 10)

  const users = []
  for (const p of PEOPLE) {
    users.push(
      await prisma.user.create({
        data: {
          name: p.name,
          nickname: p.nickname,
          email: `${p.nickname}@cowrywise.local`,
          password: p.role === 'ADMIN' ? adminPw : memberPw,
          role: p.role
        }
      })
    )
  }
  console.log(`Created ${users.length} users`)

  // Two seasons: one completed with results, one active with fixtures ahead.
  const past = await prisma.season.create({
    data: {
      name: 'August 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
      isActive: false
    }
  })

  const current = await prisma.season.create({
    data: {
      name: 'September 2026',
      startDate: new Date('2026-09-01'),
      isActive: true
    }
  })

  const groupsBySeason: Record<string, { id: string; name: string }[]> = {}

  for (const season of [past, current]) {
    const groups = []
    for (let i = 0; i < TEAMS.length; i++) {
      const g = await prisma.group.create({
        data: { name: TEAMS[i], seasonId: season.id }
      })
      groups.push(g)
      // Three players per team, rotated between seasons.
      const offset = season.id === past.id ? 0 : 1
      for (let j = 0; j < 3; j++) {
        const user = users[(i * 3 + j + offset) % users.length]
        await prisma.groupMember.upsert({
          where: { userId_groupId: { userId: user.id, groupId: g.id } },
          update: {},
          create: { userId: user.id, groupId: g.id }
        })
      }
    }
    groupsBySeason[season.id] = groups
  }

  // Completed season: a full round robin with scores, scorers and cards.
  const pastGroups = groupsBySeason[past.id]
  const results: Array<[number, number, number, number]> = [
    // homeIdx, awayIdx, homeScore, awayScore
    [0, 1, 3, 1],
    [2, 3, 2, 2],
    [0, 2, 1, 0],
    [1, 3, 4, 2],
    [0, 3, 2, 3],
    [1, 2, 0, 0]
  ]

  let day = 2
  for (const [h, a, hs, as_] of results) {
    const home = pastGroups[h]
    const away = pastGroups[a]

    const match = await prisma.match.create({
      data: {
        seasonId: past.id,
        homeGroupId: home.id,
        awayGroupId: away.id,
        homeScore: hs,
        awayScore: as_,
        matchDate: new Date(`2026-08-${String(day).padStart(2, '0')}T16:00:00Z`),
        location: 'Astro Turf, Yaba',
        status: 'COMPLETED'
      }
    })
    day += 5

    const homeMembers = await prisma.groupMember.findMany({ where: { groupId: home.id } })
    const awayMembers = await prisma.groupMember.findMany({ where: { groupId: away.id } })

    for (const m of [...homeMembers, ...awayMembers]) {
      await prisma.matchPlayer.create({
        data: { matchId: match.id, userId: m.userId, groupId: m.groupId }
      })
    }

    let minute = 8
    const addGoals = async (
      members: typeof homeMembers,
      count: number
    ) => {
      for (let i = 0; i < count; i++) {
        const scorer = members[i % members.length]
        const assister = members[(i + 1) % members.length]
        await prisma.goal.create({
          data: {
            matchId: match.id,
            scorerId: scorer.userId,
            assistId: assister.userId === scorer.userId ? null : assister.userId,
            minute
          }
        })
        minute += 11
      }
    }

    await addGoals(homeMembers, hs)
    await addGoals(awayMembers, as_)

    // A yellow here and there, one red across the season.
    if (hs + as_ >= 4) {
      await prisma.card.create({
        data: {
          matchId: match.id,
          userId: awayMembers[0].userId,
          cardType: 'YELLOW',
          minute: 55,
          reason: 'Dissent'
        }
      })
    }
    if (h === 0 && a === 3) {
      await prisma.card.create({
        data: {
          matchId: match.id,
          userId: homeMembers[1].userId,
          cardType: 'RED',
          minute: 72,
          reason: 'Serious foul play'
        }
      })
    }
  }

  // Active season: one played, one live, the rest scheduled.
  const now = groupsBySeason[current.id]
  const fixtures: Array<[number, number, string, number, number]> = [
    [0, 1, 'COMPLETED', 2, 1],
    [2, 3, 'IN_PROGRESS', 1, 1],
    [0, 2, 'SCHEDULED', 0, 0],
    [1, 3, 'SCHEDULED', 0, 0],
    [0, 3, 'SCHEDULED', 0, 0],
    [1, 2, 'SCHEDULED', 0, 0]
  ]

  let d = 5
  for (const [h, a, status, hs, as_] of fixtures) {
    const match = await prisma.match.create({
      data: {
        seasonId: current.id,
        homeGroupId: now[h].id,
        awayGroupId: now[a].id,
        homeScore: hs,
        awayScore: as_,
        matchDate: new Date(`2026-09-${String(d).padStart(2, '0')}T16:00:00Z`),
        location: 'Astro Turf, Yaba',
        status: status as 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED'
      }
    })
    d += 4

    if (status !== 'SCHEDULED') {
      const homeMembers = await prisma.groupMember.findMany({ where: { groupId: now[h].id } })
      const awayMembers = await prisma.groupMember.findMany({ where: { groupId: now[a].id } })
      for (const m of [...homeMembers, ...awayMembers]) {
        await prisma.matchPlayer.create({
          data: { matchId: match.id, userId: m.userId, groupId: m.groupId }
        })
      }
      let minute = 12
      for (let i = 0; i < hs; i++) {
        await prisma.goal.create({
          data: {
            matchId: match.id,
            scorerId: homeMembers[i % homeMembers.length].userId,
            assistId: homeMembers[(i + 1) % homeMembers.length].userId,
            minute
          }
        })
        minute += 14
      }
      for (let i = 0; i < as_; i++) {
        await prisma.goal.create({
          data: {
            matchId: match.id,
            scorerId: awayMembers[i % awayMembers.length].userId,
            minute
          }
        })
        minute += 14
      }
    }
  }

  console.log('Development seed complete.')
  console.log('  admin  → david / devadmin1')
  console.log('  member → tunde / devuser1')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
