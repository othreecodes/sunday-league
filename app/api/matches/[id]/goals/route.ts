import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST add goal to match (admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const { scorerId, assistId, minute, notes } = await req.json()

    if (!scorerId) {
      return NextResponse.json(
        { error: "Scorer ID is required" },
        { status: 400 }
      )
    }

    // Create goal
    const goal = await prisma.goal.create({
      data: {
        matchId: id,
        scorerId,
        assistId,
        minute,
        notes
      },
      include: {
        scorer: { select: { id: true, name: true } },
        assist: { select: { id: true, name: true } }
      }
    })

    // Update match scores
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeGroup: { include: { members: true } },
        awayGroup: { include: { members: true } }
      }
    })

    if (match) {
      const isHomeGoal = match.homeGroup.members.some(m => m.userId === scorerId)

      await prisma.match.update({
        where: { id },
        data: {
          homeScore: isHomeGoal ? { increment: 1 } : undefined,
          awayScore: !isHomeGoal ? { increment: 1 } : undefined
        }
      })
    }

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Error adding goal:", error)
    return NextResponse.json(
      { error: "Failed to add goal" },
      { status: 500 }
    )
  }
}
