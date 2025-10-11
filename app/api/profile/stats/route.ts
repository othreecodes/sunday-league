import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get goals scored
    const goals = await prisma.goal.count({
      where: {
        scorerId: userId
      }
    })

    // Get assists
    const assists = await prisma.goal.count({
      where: {
        assistId: userId
      }
    })

    // Get yellow cards
    const yellowCards = await prisma.card.count({
      where: {
        userId: userId,
        cardType: 'YELLOW'
      }
    })

    // Get red cards
    const redCards = await prisma.card.count({
      where: {
        userId: userId,
        cardType: 'RED'
      }
    })

    // Get teams count
    const teams = await prisma.groupMember.count({
      where: {
        userId: userId
      }
    })

    // Get matches played (unique matches where user has goals or cards)
    const matchesWithGoals = await prisma.goal.findMany({
      where: {
        scorerId: userId
      },
      select: {
        matchId: true
      },
      distinct: ['matchId']
    })

    const matchesWithCards = await prisma.card.findMany({
      where: {
        userId: userId
      },
      select: {
        matchId: true
      },
      distinct: ['matchId']
    })

    const matchesWithAssists = await prisma.goal.findMany({
      where: {
        assistId: userId
      },
      select: {
        matchId: true
      },
      distinct: ['matchId']
    })

    const matchPlayers = await prisma.matchPlayer.findMany({
      where: {
        userId: userId
      },
      select: {
        matchId: true
      },
      distinct: ['matchId']
    })

    // Combine all unique match IDs
    const uniqueMatches = new Set([
      ...matchesWithGoals.map(m => m.matchId),
      ...matchesWithCards.map(m => m.matchId),
      ...matchesWithAssists.map(m => m.matchId),
      ...matchPlayers.map(m => m.matchId)
    ])

    const matchesPlayed = uniqueMatches.size

    return NextResponse.json({
      goals,
      assists,
      yellowCards,
      redCards,
      teams,
      matchesPlayed
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
  }
}
