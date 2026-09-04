import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_LEAGUE_NAME } from "@/lib/brand"

// GET settings
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default-settings',
          leagueName: DEFAULT_LEAGUE_NAME,
          matchesPerSeason: 1
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PATCH update settings (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const data = await req.json()

    // Validate leagueName
    if (data.leagueName !== undefined) {
      if (typeof data.leagueName !== 'string' || data.leagueName.trim().length < 1) {
        return NextResponse.json(
          { error: "leagueName must be a non-empty string" },
          { status: 400 }
        )
      }
    }

    // Validate matchesPerSeason
    if (data.matchesPerSeason !== undefined) {
      if (typeof data.matchesPerSeason !== 'number' || data.matchesPerSeason < 1 || data.matchesPerSeason > 10) {
        return NextResponse.json(
          { error: "matchesPerSeason must be a number between 1 and 10" },
          { status: 400 }
        )
      }
    }

    // Get existing settings or create if not exists
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default-settings',
          leagueName: data.leagueName || DEFAULT_LEAGUE_NAME,
          matchesPerSeason: data.matchesPerSeason || 1
        }
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
