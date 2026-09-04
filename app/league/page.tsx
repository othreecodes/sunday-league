'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Trophy, Target, Award, LayoutGrid, List, Lock } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import RefreshIndicator from '@/components/RefreshIndicator'
import { useCachedData } from '@/hooks/useCachedData'
import './league.css'

interface LeagueTableEntry {
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

interface PlayerStats {
  userId: string
  userName: string
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  matchesPlayed: number
}

interface Season {
  id: string
  name: string
  isActive: boolean
}

interface LeagueData {
  table: LeagueTableEntry[]
  topScorers: PlayerStats[]
}

type ViewMode = 'list' | 'grid'

export default function League() {
  const router = useRouter()
  const { data: session } = useSession()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Scorers and assists are an admin-only view. Members see standings only.
  const isAdmin = session?.user.role === 'ADMIN'

  const fetchLeagueData = useCallback(async (): Promise<LeagueData> => {
    if (!selectedSeason) {
      throw new Error('No season selected')
    }
    const response = await fetch(`/api/league/${selectedSeason}`)
    if (!response.ok) {
      throw new Error('Failed to load league data')
    }
    return response.json()
  }, [selectedSeason])

  const { data: leagueData, loading, refreshing } = useCachedData<LeagueData>(
    fetchLeagueData,
    {
      cacheKey: `league-${selectedSeason}`,
      cacheDuration: 5 * 60 * 1000,
      enabled: !!selectedSeason
    }
  )

  useEffect(() => {
    fetchSeasons()
  }, [])

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/seasons')
      const data = await response.json()
      setSeasons(data)

      const activeSeason = data.find((s: Season) => s.isActive)
      if (activeSeason) {
        setSelectedSeason(activeSeason.id)
      } else if (data.length > 0) {
        setSelectedSeason(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load seasons:', err)
    }
  }

  const table = leagueData?.table || []
  const topScorers = leagueData?.topScorers || []
  const selectedSeasonData = seasons.find((s) => s.id === selectedSeason)

  return (
    <>
      <MobileHeader
        title="League"
        eyebrow="Standings"
        subtitle={selectedSeasonData?.name}
        rightAction={<RefreshIndicator isRefreshing={refreshing} />}
      />

      <MobileContainer>
        {/* Season selector */}
        {seasons.length > 1 && (
          <div className="season-bar">
            <label className="season-label" htmlFor="season-select">
              Season
            </label>
            <select
              id="season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="season-select"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                  {season.isActive ? ' · current' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && !leagueData ? (
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading league data…</p>
          </div>
        ) : (
          <div className={isAdmin ? 'split-2' : ''}>
            {/* ---------------------------------------------------------- */}
            {/* Standings                                                  */}
            {/* ---------------------------------------------------------- */}
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">Table</h2>
                <div className="view-toggle" role="group" aria-label="Table layout">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                    aria-label="Table view"
                    aria-pressed={viewMode === 'list'}
                  >
                    <List size={17} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    aria-label="Card view"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <LayoutGrid size={17} />
                  </button>
                </div>
              </div>

              {table.length === 0 ? (
                <div className="mobile-empty-state">
                  <div className="mobile-empty-icon">
                    <Trophy />
                  </div>
                  <h3 className="mobile-empty-title">No matches played yet</h3>
                  <p className="mobile-empty-description">
                    The table fills in as results are recorded.
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <MobileCard padding="none" className="league-table-card">
                  <div className="league-table-wrapper">
                    <table className="league-table">
                      <thead>
                        <tr>
                          <th className="col-pos" scope="col">
                            <span className="sr-only">Position</span>#
                          </th>
                          <th className="col-team" scope="col">Team</th>
                          <th className="col-stat" scope="col" title="Played">P</th>
                          <th className="col-stat" scope="col" title="Won">W</th>
                          <th className="col-stat" scope="col" title="Drawn">D</th>
                          <th className="col-stat" scope="col" title="Lost">L</th>
                          <th className="col-stat col-wide" scope="col" title="Goals for">GF</th>
                          <th className="col-stat col-wide" scope="col" title="Goals against">GA</th>
                          <th className="col-stat" scope="col" title="Goal difference">GD</th>
                          <th className="col-pts" scope="col" title="Points">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.map((entry, index) => (
                          <tr
                            key={entry.groupId}
                            onClick={() => router.push(`/groups/${entry.groupId}`)}
                            className="table-row"
                          >
                            <td className="col-pos">
                              <span className={`position-badge ${index === 0 ? 'first' : ''}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="col-team">
                              <span className="team-name-table">{entry.groupName}</span>
                            </td>
                            <td className="col-stat">{entry.played}</td>
                            <td className="col-stat">{entry.won}</td>
                            <td className="col-stat">{entry.drawn}</td>
                            <td className="col-stat">{entry.lost}</td>
                            <td className="col-stat col-wide">{entry.goalsFor}</td>
                            <td className="col-stat col-wide">{entry.goalsAgainst}</td>
                            <td className="col-stat">
                              <span className={entry.goalDifference >= 0 ? 'positive' : 'negative'}>
                                {entry.goalDifference >= 0 ? '+' : ''}
                                {entry.goalDifference}
                              </span>
                            </td>
                            <td className="col-pts">
                              <span className="points-badge">{entry.points}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </MobileCard>
              ) : (
                <div className="auto-grid">
                  {table.map((entry, index) => (
                    <MobileCard
                      key={entry.groupId}
                      padding="medium"
                      onClick={() => router.push(`/groups/${entry.groupId}`)}
                    >
                      <div className="team-card">
                        <div className="team-card-header">
                          <span className={`position-badge ${index === 0 ? 'first' : ''}`}>
                            {index + 1}
                          </span>
                          <div className="team-info">
                            <h3 className="team-name">{entry.groupName}</h3>
                            <p className="team-subtitle">
                              {entry.played} {entry.played === 1 ? 'match' : 'matches'} played
                            </p>
                          </div>
                          <div className="team-points">
                            <span className="points-value">{entry.points}</span>
                            <span className="points-label">pts</span>
                          </div>
                        </div>

                        <div className="team-stats">
                          {[
                            ['W', entry.won, ''],
                            ['D', entry.drawn, ''],
                            ['L', entry.lost, ''],
                            ['GF', entry.goalsFor, ''],
                            ['GA', entry.goalsAgainst, ''],
                            [
                              'GD',
                              `${entry.goalDifference >= 0 ? '+' : ''}${entry.goalDifference}`,
                              entry.goalDifference >= 0 ? 'positive' : 'negative'
                            ]
                          ].map(([label, value, tone]) => (
                            <div className="stat-item" key={String(label)}>
                              <span className="stat-label">{label}</span>
                              <span className={`stat-value ${tone}`}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Top scorers — admin only                                   */}
            {/* ---------------------------------------------------------- */}
            {isAdmin && (
              <div className="mobile-section">
                <div className="mobile-section-header">
                  <h2 className="mobile-section-title">
                    <Award size={16} />
                    Scorers &amp; assists
                  </h2>
                  <span className="admin-only-tag">
                    <Lock size={10} />
                    Admin only
                  </span>
                </div>

                {topScorers.length === 0 ? (
                  <div className="mobile-empty-state">
                    <div className="mobile-empty-icon">
                      <Target />
                    </div>
                    <h3 className="mobile-empty-title">No goals recorded yet</h3>
                    <p className="mobile-empty-description">
                      Scorers appear here once goals are logged against a match.
                    </p>
                  </div>
                ) : (
                  <MobileCard padding="none">
                    <ol className="scorer-list">
                      {topScorers.map((player, index) => (
                        <li key={player.userId} className="scorer-row">
                          <span className={`scorer-rank ${index === 0 ? 'first' : ''}`}>
                            {index + 1}
                          </span>
                          <span className="scorer-identity">
                            <span className="scorer-name">{player.userName}</span>
                            <span className="scorer-meta">
                              {player.matchesPlayed}{' '}
                              {player.matchesPlayed === 1 ? 'match' : 'matches'}
                              {player.assists > 0 && ` · ${player.assists} assists`}
                            </span>
                          </span>
                          <span className="scorer-figure">
                            <span className="scorer-goals">{player.goals}</span>
                            <span className="scorer-goals-label">
                              {player.goals === 1 ? 'goal' : 'goals'}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </MobileCard>
                )}
              </div>
            )}
          </div>
        )}
      </MobileContainer>
    </>
  )
}
