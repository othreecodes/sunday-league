import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all groups
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")

    const where: Record<string, string> = {}
    if (seasonId) where.seasonId = seasonId

    const groups = await prisma.group.findMany({
      where,
      include: {
        season: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        _count: {
          select: {
            members: true,
            homeMatches: true,
            awayMatches: true
          }
        }
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}

// POST create a new group (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, seasonId, memberIds } = await req.json()

    if (!name || !seasonId) {
      return NextResponse.json(
        { error: "Name and season ID are required" },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        seasonId,
        members: memberIds ? {
          create: memberIds.map((userId: string) => ({ userId }))
        } : undefined
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    )
  }
}
