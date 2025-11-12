import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST merge temporary user with real user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tempUserId, realUserId } = await req.json()

    if (!tempUserId || !realUserId) {
      return NextResponse.json(
        { error: 'Both tempUserId and realUserId are required' },
        { status: 400 }
      )
    }

    // Verify temp user is actually temporary
    const tempUser = await prisma.user.findUnique({
      where: { id: tempUserId },
      select: { isTemporary: true, name: true }
    })

    if (!tempUser) {
      return NextResponse.json({ error: 'Temporary user not found' }, { status: 404 })
    }

    if (!tempUser.isTemporary) {
      return NextResponse.json(
        { error: 'User is not marked as temporary' },
        { status: 400 }
      )
    }

    // Verify real user exists and is not temporary
    const realUser = await prisma.user.findUnique({
      where: { id: realUserId },
      select: { isTemporary: true, name: true }
    })

    if (!realUser) {
      return NextResponse.json({ error: 'Real user not found' }, { status: 404 })
    }

    if (realUser.isTemporary) {
      return NextResponse.json(
        { error: 'Target user cannot be temporary' },
        { status: 400 }
      )
    }

    // Perform the merge in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Transfer all goals scored
      await tx.goal.updateMany({
        where: { scorerId: tempUserId },
        data: { scorerId: realUserId }
      })

      // 2. Transfer all assists
      await tx.goal.updateMany({
        where: { assistId: tempUserId },
        data: { assistId: realUserId }
      })

      // 3. Transfer all cards
      await tx.card.updateMany({
        where: { userId: tempUserId },
        data: { userId: realUserId }
      })

      // 4. Transfer group memberships (avoid duplicates)
      const tempGroupMembers = await tx.groupMember.findMany({
        where: { userId: tempUserId },
        select: { groupId: true }
      })

      const realGroupMembers = await tx.groupMember.findMany({
        where: { userId: realUserId },
        select: { groupId: true }
      })

      const realGroupIds = new Set(realGroupMembers.map(gm => gm.groupId))

      // Only transfer group memberships that don't already exist for real user
      for (const tempMember of tempGroupMembers) {
        if (!realGroupIds.has(tempMember.groupId)) {
          await tx.groupMember.updateMany({
            where: {
              userId: tempUserId,
              groupId: tempMember.groupId
            },
            data: { userId: realUserId }
          })
        } else {
          // Delete duplicate group membership
          await tx.groupMember.deleteMany({
            where: {
              userId: tempUserId,
              groupId: tempMember.groupId
            }
          })
        }
      }

      // 5. Transfer match players (avoid duplicates)
      const tempMatchPlayers = await tx.matchPlayer.findMany({
        where: { userId: tempUserId },
        select: { matchId: true }
      })

      const realMatchPlayers = await tx.matchPlayer.findMany({
        where: { userId: realUserId },
        select: { matchId: true }
      })

      const realMatchIds = new Set(realMatchPlayers.map(mp => mp.matchId))

      for (const tempPlayer of tempMatchPlayers) {
        if (!realMatchIds.has(tempPlayer.matchId)) {
          await tx.matchPlayer.updateMany({
            where: {
              userId: tempUserId,
              matchId: tempPlayer.matchId
            },
            data: { userId: realUserId }
          })
        } else {
          // Delete duplicate match player
          await tx.matchPlayer.deleteMany({
            where: {
              userId: tempUserId,
              matchId: tempPlayer.matchId
            }
          })
        }
      }

      // 6. Delete the temporary user
      await tx.user.delete({
        where: { id: tempUserId }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${tempUser.name} into ${realUser.name}`
    })
  } catch (error) {
    console.error('Error merging users:', error)
    return NextResponse.json(
      { error: 'Failed to merge users' },
      { status: 500 }
    )
  }
}
