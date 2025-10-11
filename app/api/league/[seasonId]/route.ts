import { NextResponse } from "next/server"
import { calculateLeagueTable, getPlayerStats } from "@/lib/league-utils"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params
    const table = await calculateLeagueTable(seasonId)
    const topScorers = await getPlayerStats(seasonId, 10)

    return NextResponse.json({
      table,
      topScorers
    })
  } catch (error) {
    console.error("Error calculating league table:", error)
    return NextResponse.json(
      { error: "Failed to calculate league table" },
      { status: 500 }
    )
  }
}
