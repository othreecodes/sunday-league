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
    const { userId, cardType, minute, reason } = await req.json()

    // Create the card
    const card = await prisma.card.create({
      data: {
        matchId,
        userId,
        cardType,
        minute,
        reason: reason || null
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    })

    // Update match status if it's scheduled
    await prisma.match.updateMany({
      where: {
        id: matchId,
        status: 'SCHEDULED'
      },
      data: {
        status: 'IN_PROGRESS'
      }
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error adding card:', error)
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 })
  }
}
