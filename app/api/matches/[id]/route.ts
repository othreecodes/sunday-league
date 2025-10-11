import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single match
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        season: { select: { id: true, name: true } },
        homeGroup: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        awayGroup: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        goals: {
          include: {
            scorer: { select: { id: true, name: true } },
            assist: { select: { id: true, name: true } }
          },
          orderBy: { minute: "asc" }
        },
        cards: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { minute: "asc" }
        },
        players: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error("Error fetching match:", error)
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    )
  }
}

// PATCH update match (admin only)
export async function PATCH(
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
    const data = await req.json()

    const match = await prisma.match.update({
      where: { id },
      data,
      include: {
        homeGroup: true,
        awayGroup: true
      }
    })

    return NextResponse.json(match)
  } catch (error) {
    console.error("Error updating match:", error)
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    )
  }
}

// DELETE match (admin only)
export async function DELETE(
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

    await prisma.match.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Match deleted successfully" })
  } catch (error) {
    console.error("Error deleting match:", error)
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 }
    )
  }
}
