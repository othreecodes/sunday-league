import { prisma } from "./prisma"

export interface LeagueTableEntry {
  groupId: string
  groupName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface PlayerStats {
  userId: string
  userName: string
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  matchesPlayed: number
}

export async function calculateLeagueTable(seasonId: string): Promise<LeagueTableEntry[]> {
  const groups = await prisma.group.findMany({
    where: { seasonId },
    include: {
      homeMatches: {
        where: { status: "COMPLETED" },
        include: { goals: true }
      },
      awayMatches: {
        where: { status: "COMPLETED" },
        include: { goals: true }
      }
    }
  })

  const table: LeagueTableEntry[] = groups.map(group => {
    let played = 0
    let won = 0
    let drawn = 0
    let lost = 0
    let goalsFor = 0
    let goalsAgainst = 0

    // Process home matches
    group.homeMatches.forEach(match => {
      played++
      goalsFor += match.homeScore
      goalsAgainst += match.awayScore

      if (match.homeScore > match.awayScore) won++
      else if (match.homeScore === match.awayScore) drawn++
      else lost++
    })

    // Process away matches
    group.awayMatches.forEach(match => {
      played++
      goalsFor += match.awayScore
      goalsAgainst += match.homeScore

      if (match.awayScore > match.homeScore) won++
      else if (match.awayScore === match.homeScore) drawn++
      else lost++
    })

    const points = (won * 3) + drawn
    const goalDifference = goalsFor - goalsAgainst

    return {
      groupId: group.id,
      groupName: group.name,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points
    }
  })

  // Sort by points, then goal difference, then goals for
  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
}

export async function getPlayerStats(seasonId: string, limit = 10): Promise<PlayerStats[]> {
  const matches = await prisma.match.findMany({
    where: {
      seasonId,
      status: "COMPLETED"
    },
    include: {
      goals: {
        include: {
          scorer: true,
          assist: true
        }
      },
      cards: {
        include: {
          user: true
        }
      },
      players: {
        include: {
          user: true
        }
      }
    }
  })

  const statsMap = new Map<string, PlayerStats>()

  matches.forEach(match => {
    // Count matches played
    match.players.forEach(player => {
      if (!statsMap.has(player.userId)) {
        statsMap.set(player.userId, {
          userId: player.userId,
          userName: player.user.name,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          matchesPlayed: 0
        })
      }
      const stats = statsMap.get(player.userId)!
      stats.matchesPlayed++
    })

    // Count goals and assists
    match.goals.forEach(goal => {
      if (!statsMap.has(goal.scorerId)) {
        statsMap.set(goal.scorerId, {
          userId: goal.scorerId,
          userName: goal.scorer.name,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          matchesPlayed: 0
        })
      }
      const scorerStats = statsMap.get(goal.scorerId)!
      scorerStats.goals++

      if (goal.assistId && goal.assist) {
        if (!statsMap.has(goal.assistId)) {
          statsMap.set(goal.assistId, {
            userId: goal.assistId,
            userName: goal.assist.name,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            matchesPlayed: 0
          })
        }
        const assistStats = statsMap.get(goal.assistId)!
        assistStats.assists++
      }
    })

    // Count cards
    match.cards.forEach(card => {
      if (!statsMap.has(card.userId)) {
        statsMap.set(card.userId, {
          userId: card.userId,
          userName: card.user.name,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          matchesPlayed: 0
        })
      }
      const stats = statsMap.get(card.userId)!
      if (card.cardType === "YELLOW") {
        stats.yellowCards++
      } else {
        stats.redCards++
      }
    })
  })

  // Convert to array and sort by goals
  return Array.from(statsMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}
