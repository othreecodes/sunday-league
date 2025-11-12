import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sundayleague.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@sundayleague.local',
      password: adminPassword,
      role: 'ADMIN'
    }
  })
  console.log('Created admin user:', admin.email)

  // Create regular users
  const userPassword = await bcrypt.hash('user123', 10)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@sundayleague.local' },
      update: {},
      create: { name: 'John Doe', email: 'john@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'jane@sundayleague.local' },
      update: {},
      create: { name: 'Jane Smith', email: 'jane@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'mike@sundayleague.local' },
      update: {},
      create: { name: 'Mike Johnson', email: 'mike@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'sarah@sundayleague.local' },
      update: {},
      create: { name: 'Sarah Williams', email: 'sarah@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'david@sundayleague.local' },
      update: {},
      create: { name: 'David Brown', email: 'david@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'emma@sundayleague.local' },
      update: {},
      create: { name: 'Emma Davis', email: 'emma@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'james@sundayleague.local' },
      update: {},
      create: { name: 'James Wilson', email: 'james@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'lisa@sundayleague.local' },
      update: {},
      create: { name: 'Lisa Moore', email: 'lisa@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'tom@sundayleague.local' },
      update: {},
      create: { name: 'Tom Taylor', email: 'tom@sundayleague.local', password: userPassword, role: 'MEMBER' }
    }),
    prisma.user.upsert({
      where: { email: 'kate@sundayleague.local' },
      update: {},
      create: { name: 'Kate Anderson', email: 'kate@sundayleague.local', password: userPassword, role: 'MEMBER' }
    })
  ])
  console.log('Created users:', users.length)

  // Create season
  const season = await prisma.season.upsert({
    where: { id: 'season-2025' },
    update: {},
    create: {
      id: 'season-2025',
      name: '2025 Season',
      startDate: new Date('2025-01-01'),
      isActive: true
    }
  })
  console.log('Created season:', season.name)

  // Create groups
  const teamA = await prisma.group.upsert({
    where: { id: 'team-a' },
    update: {},
    create: {
      id: 'team-a',
      name: 'Team A',
      seasonId: season.id
    }
  })

  const teamB = await prisma.group.upsert({
    where: { id: 'team-b' },
    update: {},
    create: {
      id: 'team-b',
      name: 'Team B',
      seasonId: season.id
    }
  })

  const teamC = await prisma.group.upsert({
    where: { id: 'team-c' },
    update: {},
    create: {
      id: 'team-c',
      name: 'Team C',
      seasonId: season.id
    }
  })

  const teamD = await prisma.group.upsert({
    where: { id: 'team-d' },
    update: {},
    create: {
      id: 'team-d',
      name: 'Team D',
      seasonId: season.id
    }
  })
  console.log('Created teams: A, B, C, D')

  // Add members to teams (check if they don't exist first)
  const existingMembers = await prisma.groupMember.findMany()
  if (existingMembers.length === 0) {
    await prisma.groupMember.createMany({
      data: [
        { groupId: teamA.id, userId: users[0].id },
        { groupId: teamA.id, userId: users[1].id },
        { groupId: teamA.id, userId: users[2].id },
        { groupId: teamB.id, userId: users[3].id },
        { groupId: teamB.id, userId: users[4].id },
        { groupId: teamB.id, userId: users[5].id },
        { groupId: teamC.id, userId: users[6].id },
        { groupId: teamC.id, userId: users[7].id },
        { groupId: teamD.id, userId: users[8].id },
        { groupId: teamD.id, userId: users[9].id }
      ]
    })
  }
  console.log('Added members to teams')

  // Create completed match 1: Team A vs Team B
  const match1 = await prisma.match.create({
    data: {
      seasonId: season.id,
      homeGroupId: teamA.id,
      awayGroupId: teamB.id,
      matchDate: new Date('2025-01-15T14:00:00'),
      location: 'Main Pitch',
      status: 'COMPLETED',
      homeScore: 3,
      awayScore: 2
    }
  })

  // Goals for match 1
  await prisma.goal.createMany({
    data: [
      { matchId: match1.id, scorerId: users[0].id, minute: 10 },
      { matchId: match1.id, scorerId: users[3].id, minute: 15 },
      { matchId: match1.id, scorerId: users[1].id, assistId: users[0].id, minute: 25 },
      { matchId: match1.id, scorerId: users[0].id, minute: 40 },
      { matchId: match1.id, scorerId: users[4].id, assistId: users[3].id, minute: 55 }
    ]
  })

  // Cards for match 1
  await prisma.card.createMany({
    data: [
      { matchId: match1.id, userId: users[2].id, cardType: 'YELLOW', minute: 30, reason: 'Foul' }
    ]
  })

  // Create completed match 2: Team C vs Team D
  const match2 = await prisma.match.create({
    data: {
      seasonId: season.id,
      homeGroupId: teamC.id,
      awayGroupId: teamD.id,
      matchDate: new Date('2025-01-15T16:00:00'),
      location: 'Main Pitch',
      status: 'COMPLETED',
      homeScore: 1,
      awayScore: 1
    }
  })

  // Goals for match 2
  await prisma.goal.createMany({
    data: [
      { matchId: match2.id, scorerId: users[6].id, minute: 20 },
      { matchId: match2.id, scorerId: users[8].id, minute: 45 }
    ]
  })

  // Create completed match 3: Team A vs Team C
  const match3 = await prisma.match.create({
    data: {
      seasonId: season.id,
      homeGroupId: teamA.id,
      awayGroupId: teamC.id,
      matchDate: new Date('2025-01-22T14:00:00'),
      location: 'Main Pitch',
      status: 'COMPLETED',
      homeScore: 2,
      awayScore: 0
    }
  })

  // Goals for match 3
  await prisma.goal.createMany({
    data: [
      { matchId: match3.id, scorerId: users[1].id, minute: 12 },
      { matchId: match3.id, scorerId: users[2].id, assistId: users[1].id, minute: 35 }
    ]
  })

  // Create completed match 4: Team B vs Team D
  const match4 = await prisma.match.create({
    data: {
      seasonId: season.id,
      homeGroupId: teamB.id,
      awayGroupId: teamD.id,
      matchDate: new Date('2025-01-22T16:00:00'),
      location: 'Main Pitch',
      status: 'COMPLETED',
      homeScore: 4,
      awayScore: 1
    }
  })

  // Goals for match 4
  await prisma.goal.createMany({
    data: [
      { matchId: match4.id, scorerId: users[3].id, minute: 8 },
      { matchId: match4.id, scorerId: users[4].id, minute: 18 },
      { matchId: match4.id, scorerId: users[8].id, minute: 22 },
      { matchId: match4.id, scorerId: users[3].id, minute: 35 },
      { matchId: match4.id, scorerId: users[5].id, assistId: users[4].id, minute: 50 }
    ]
  })

  // Create upcoming match
  await prisma.match.create({
    data: {
      seasonId: season.id,
      homeGroupId: teamA.id,
      awayGroupId: teamD.id,
      matchDate: new Date('2025-01-29T14:00:00'),
      location: 'Main Pitch',
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0
    }
  })

  await prisma.match.create({
    data: {
      seasonId: season.id,
      homeGroupId: teamB.id,
      awayGroupId: teamC.id,
      matchDate: new Date('2025-01-29T16:00:00'),
      location: 'Main Pitch',
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0
    }
  })

  console.log('Created matches with goals and cards')

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      matchesPerSeason: 1
    }
  })
  console.log('Created default settings: matchesPerSeason =', settings.matchesPerSeason)

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
