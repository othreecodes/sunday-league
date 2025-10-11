import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        groups: true,
        matches: {
          include: {
            homeGroup: true,
            awayGroup: true
          }
        },
        _count: {
          select: {
            groups: true,
            matches: true
          }
        }
      }
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    return NextResponse.json(season)
  } catch (error) {
    console.error('Error fetching season:', error)
    return NextResponse.json({ error: 'Failed to fetch season' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, startDate, endDate, isActive } = body

    // If activating this season, deactivate all others
    if (isActive === true) {
      await prisma.season.updateMany({
        where: { id: { not: id } },
        data: { isActive: false }
      })
    }

    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(season)
  } catch (error) {
    console.error('Error updating season:', error)
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete all related data in correct order
    await prisma.$transaction([
      // Delete goals
      prisma.goal.deleteMany({
        where: {
          match: {
            seasonId: id
          }
        }
      }),
      // Delete cards
      prisma.card.deleteMany({
        where: {
          match: {
            seasonId: id
          }
        }
      }),
      // Delete match players
      prisma.matchPlayer.deleteMany({
        where: {
          match: {
            seasonId: id
          }
        }
      }),
      // Delete matches
      prisma.match.deleteMany({
        where: { seasonId: id }
      }),
      // Delete group members
      prisma.groupMember.deleteMany({
        where: {
          group: {
            seasonId: id
          }
        }
      }),
      // Delete groups
      prisma.group.deleteMany({
        where: { seasonId: id }
      }),
      // Finally delete the season
      prisma.season.delete({
        where: { id }
      })
    ])

    return NextResponse.json({ message: 'Season deleted successfully' })
  } catch (error) {
    console.error('Error deleting season:', error)
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 })
  }
}
