import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; membershipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { membershipId } = await params

    await prisma.groupMember.delete({
      where: { id: membershipId }
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing group member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
