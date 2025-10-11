import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST add card to match (admin only)
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
    const { userId, cardType, minute, reason } = await req.json()

    if (!userId || !cardType) {
      return NextResponse.json(
        { error: "User ID and card type are required" },
        { status: 400 }
      )
    }

    if (!["YELLOW", "RED"].includes(cardType)) {
      return NextResponse.json(
        { error: "Invalid card type" },
        { status: 400 }
      )
    }

    const card = await prisma.card.create({
      data: {
        matchId: id,
        userId,
        cardType,
        minute,
        reason
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error("Error adding card:", error)
    return NextResponse.json(
      { error: "Failed to add card" },
      { status: 500 }
    )
  }
}
