import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: matchId, goalId } = await params

    // Get the goal to find the scorer
    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Delete the goal
    await prisma.goal.delete({
      where: { id: goalId }
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
      // Check if scorer was in home team
      const isHomeTeam = match.homeGroup.members.some(m => m.userId === goal.scorerId)

      // Update the match score (decrement)
      await prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: isHomeTeam ? Math.max(0, match.homeScore - 1) : match.homeScore,
          awayScore: !isHomeTeam ? Math.max(0, match.awayScore - 1) : match.awayScore
        }
      })
    }

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
