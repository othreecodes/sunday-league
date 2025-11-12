'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Target, Award, Calendar, LayoutGrid, List } from 'lucide-react'
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
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Fetch function for league data
  const fetchLeagueData = useCallback(async (): Promise<LeagueData> => {
    const response = await fetch(`/api/league/${selectedSeason}`)
    if (!response.ok) {
      throw new Error('Failed to load league data')
    }
    return response.json()
  }, [selectedSeason])

  // Use cached data hook
  const { data: leagueData, loading, refreshing, refetch } = useCachedData<LeagueData>(
    fetchLeagueData,
    {
      cacheKey: `league-${selectedSeason}`,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
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

      // Select active season or first season by default
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

  const selectedSeasonData = seasons.find(s => s.id === selectedSeason)

  return (
    <>
      <MobileHeader
        title="League"
        subtitle={selectedSeasonData?.name}
        rightAction={<RefreshIndicator isRefreshing={refreshing} />}
      />

      <MobileContainer>
        {/* Season Selector */}
        {seasons.length > 1 && (
          <MobileCard padding="medium" className="season-selector-card">
            <div className="season-selector-content">
              <Calendar size={20} />
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="season-select"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name} {season.isActive && '⭐'}
                  </option>
                ))}
              </select>
            </div>
          </MobileCard>
        )}

        {loading && !leagueData ? (
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading league data...</p>
          </div>
        ) : (
          <>
            {/* Standings Section */}
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">Standings</h2>
                <div className="view-toggle">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                    aria-label="List view"
                  >
                    <List size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={20} />
                  </button>
                </div>
              </div>

              {table.length === 0 ? (
                <div className="mobile-empty-state">
                  <div className="mobile-empty-icon">
                    <Trophy size={64} />
                  </div>
                  <h3 className="mobile-empty-title">No matches played yet</h3>
                  <p className="mobile-empty-description">
                    The league table will appear once matches are played
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <MobileCard padding="none" className="league-table-card">
                  <div className="league-table-wrapper">
                    <table className="league-table">
                      <thead>
                        <tr>
                          <th className="col-pos">#</th>
                          <th className="col-team">Team</th>
                          <th className="col-stat">P</th>
                          <th className="col-stat">W</th>
                          <th className="col-stat">D</th>
                          <th className="col-stat">L</th>
                          <th className="col-stat">GD</th>
                          <th className="col-pts">Pts</th>
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
                            <td className="col-stat">
                              <span className={entry.goalDifference >= 0 ? 'positive' : 'negative'}>
                                {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
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
                <div className="mobile-card-list">
                  {table.map((entry, index) => (
                    <MobileCard
                      key={entry.groupId}
                      padding="medium"
                      onClick={() => router.push(`/groups/${entry.groupId}`)}
                    >
                      <div className="team-card">
                        <div className="team-card-header">
                          <div className="team-position">
                            <span className={`position-badge ${index === 0 ? 'first' : ''}`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="team-info">
                            <h3 className="team-name">{entry.groupName}</h3>
                            <p className="team-subtitle">{entry.played} matches played</p>
                          </div>
                          <div className="team-points">
                            <div className="points-value">{entry.points}</div>
                            <div className="points-label">PTS</div>
                          </div>
                        </div>
                        <div className="team-stats">
                          <div className="stat-group">
                            <div className="stat-item">
                              <span className="stat-label">W</span>
                              <span className="stat-value">{entry.won}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">D</span>
                              <span className="stat-value">{entry.drawn}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">L</span>
                              <span className="stat-value">{entry.lost}</span>
                            </div>
                          </div>
                          <div className="stat-group">
                            <div className="stat-item">
                              <span className="stat-label">GF</span>
                              <span className="stat-value">{entry.goalsFor}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">GA</span>
                              <span className="stat-value">{entry.goalsAgainst}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">GD</span>
                              <span className={`stat-value ${entry.goalDifference >= 0 ? 'positive' : 'negative'}`}>
                                {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              )}
            </div>

            {/* Top Scorers Section */}
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">
                  <Award size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Top Scorers
                </h2>
              </div>

              {topScorers.length === 0 ? (
                <div className="mobile-empty-state">
                  <div className="mobile-empty-icon">
                    <Target size={64} />
                  </div>
                  <h3 className="mobile-empty-title">No goals scored yet</h3>
                  <p className="mobile-empty-description">
                    Top scorers will appear once goals are recorded
                  </p>
                </div>
              ) : (
                <div className="mobile-card-list">
                  {topScorers.map((player, index) => (
                    <MobileCard key={player.userId} padding="medium">
                      <div className="scorer-card-mobile">
                        <div className="scorer-rank-badge">
                          {index + 1}
                        </div>
                        <div className="scorer-details">
                          <h3 className="scorer-name">{player.userName}</h3>
                          <div className="scorer-stats-list">
                            <span className="scorer-stat">
                              <Target size={14} />
                              {player.goals} goals
                            </span>
                            {player.assists > 0 && (
                              <span className="scorer-stat">
                                <Trophy size={14} />
                                {player.assists} assists
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="scorer-goals-badge">
                          {player.goals}
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </MobileContainer>
    </>
  )
}
