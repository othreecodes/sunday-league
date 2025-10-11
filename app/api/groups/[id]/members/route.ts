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

    const { id: groupId } = await params
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if member already exists
    const existing = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding group member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
