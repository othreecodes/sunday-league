import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all matches
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")
    const status = searchParams.get("status")

    const where: Record<string, string> = {}
    if (seasonId) where.seasonId = seasonId
    if (status) where.status = status

    const matches = await prisma.match.findMany({
      where,
      include: {
        season: { select: { id: true, name: true } },
        homeGroup: true,
        awayGroup: true,
        goals: {
          include: {
            scorer: { select: { id: true, name: true } },
            assist: { select: { id: true, name: true } }
          }
        },
        cards: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { matchDate: "desc" }
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    )
  }
}

// POST create a new match (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { seasonId, homeGroupId, awayGroupId, matchDate, location } = await req.json()

    if (!seasonId || !homeGroupId || !awayGroupId || !matchDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const match = await prisma.match.create({
      data: {
        seasonId,
        homeGroupId,
        awayGroupId,
        matchDate: new Date(matchDate),
        location
      },
      include: {
        season: { select: { id: true, name: true } },
        homeGroup: true,
        awayGroup: true
      }
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error("Error creating match:", error)
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    )
  }
}
