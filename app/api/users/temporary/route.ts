import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all temporary users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tempUsers = await prisma.user.findMany({
      where: {
        isTemporary: true
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        createdAt: true,
        _count: {
          select: {
            goalsScored: true,
            assists: true,
            cardsReceived: true,
            groupMembers: true,
            matchPlayers: true
          }
        },
        groupMembers: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                season: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tempUsers)
  } catch (error) {
    console.error('Error fetching temporary users:', error)
    return NextResponse.json({ error: 'Failed to fetch temporary users' }, { status: 500 })
  }
}

// POST create a temporary user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, nickname, groupId } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create temporary user
    const tempUser = await prisma.user.create({
      data: {
        name,
        nickname: nickname || undefined,
        isTemporary: true,
        role: 'MEMBER',
        // Add to group if groupId provided
        ...(groupId && {
          groupMembers: {
            create: {
              groupId
            }
          }
        })
      },
      include: {
        groupMembers: {
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(tempUser, { status: 201 })
  } catch (error) {
    console.error('Error creating temporary user:', error)
    return NextResponse.json({ error: 'Failed to create temporary user' }, { status: 500 })
  }
}
