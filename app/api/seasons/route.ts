import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all seasons
export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        _count: {
          select: {
            groups: true,
            matches: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(seasons)
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return NextResponse.json(
      { error: "Failed to fetch seasons" },
      { status: 500 }
    )
  }
}

// POST create a new season (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, startDate, endDate } = await req.json()

    if (!name || !startDate) {
      return NextResponse.json(
        { error: "Name and start date are required" },
        { status: 400 }
      )
    }

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined
      }
    })

    return NextResponse.json(season, { status: 201 })
  } catch (error) {
    console.error("Error creating season:", error)
    return NextResponse.json(
      { error: "Failed to create season" },
      { status: 500 }
    )
  }
}
