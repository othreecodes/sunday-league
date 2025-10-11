import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: matchId } = await params
    const { scorerId, assistId, minute } = await req.json()

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        matchId,
        scorerId,
        assistId: assistId || null,
        minute
      },
      include: {
        scorer: { select: { id: true, name: true } },
        assist: { select: { id: true, name: true } }
      }
    })

    // Get the match to determine which team scored
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeGroup: {
          include: {
            members: { select: { userId: true } }
          }
        }
      }
    })

    if (match) {
      // Check if scorer is in home team
      const isHomeTeam = match.homeGroup.members.some(m => m.userId === scorerId)

      // Update the match score
      await prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: isHomeTeam ? { increment: 1 } : match.homeScore,
          awayScore: !isHomeTeam ? { increment: 1 } : match.awayScore,
          status: match.status === 'SCHEDULED' ? 'IN_PROGRESS' : match.status
        }
      })
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error adding goal:', error)
    return NextResponse.json({ error: 'Failed to add goal' }, { status: 500 })
  }
}
