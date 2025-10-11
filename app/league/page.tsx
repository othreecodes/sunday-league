'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Trophy, Home, User, Shield, Target, Award, Calendar } from 'lucide-react'
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

export default function League() {
  const { data: session } = useSession()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [table, setTable] = useState<LeagueTableEntry[]>([])
  const [topScorers, setTopScorers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      fetchLeagueData()
    }
  }, [selectedSeason])

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
      setError('Failed to load seasons')
    }
  }

  const fetchLeagueData = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/league/${selectedSeason}`)
      const data = await response.json()

      setTable(data.table)
      setTopScorers(data.topScorers)
    } catch (err) {
      setError('Failed to load league data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="league-container">
      <header className="league-header">
        <div className="header-content">
          <div className="header-title">
            <Trophy size={32} />
            <h1>League Table</h1>
          </div>
          <nav className="header-nav">
            <Link href="/" className="nav-link">
              <Home size={18} />
              Home
            </Link>
            {session ? (
              <>
                <Link href="/profile" className="nav-link">
                  <User size={18} />
                  Profile
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" className="nav-link">
                    <Shield size={18} />
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link href="/auth/signin" className="nav-link">Sign In</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="league-main">
        {seasons.length > 0 && (
          <div className="season-selector">
            <Calendar size={20} />
            <label htmlFor="season">Season:</label>
            <select
              id="season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.isActive && '(Current)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <section className="table-section">
              <h2>Standings</h2>

              {table.length === 0 ? (
                <div className="empty-state">
                  <Trophy size={48} />
                  <p>No matches played yet this season</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="league-table">
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.map((entry, index) => (
                        <tr key={entry.groupId} className={index === 0 ? 'first-place' : ''}>
                          <td>{index + 1}</td>
                          <td className="team-name">{entry.groupName}</td>
                          <td>{entry.played}</td>
                          <td>{entry.won}</td>
                          <td>{entry.drawn}</td>
                          <td>{entry.lost}</td>
                          <td>{entry.goalsFor}</td>
                          <td>{entry.goalsAgainst}</td>
                          <td className={entry.goalDifference >= 0 ? 'positive' : 'negative'}>
                            {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                          </td>
                          <td className="points">{entry.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="stats-section">
              <h2>
                <Award size={24} />
                Top Scorers
              </h2>

              {topScorers.length === 0 ? (
                <div className="empty-state">
                  <Target size={48} />
                  <p>No goals scored yet this season</p>
                </div>
              ) : (
                <div className="scorers-list">
                  {topScorers.map((player, index) => (
                    <div key={player.userId} className="scorer-card">
                      <div className="scorer-rank">{index + 1}</div>
                      <div className="scorer-info">
                        <div className="scorer-name">{player.userName}</div>
                        <div className="scorer-stats">
                          <span className="stat-item">
                            <Target size={14} />
                            {player.goals} goals
                          </span>
                          {player.assists > 0 && (
                            <span className="stat-item">
                              <Trophy size={14} />
                              {player.assists} assists
                            </span>
                          )}
                          <span className="stat-item">
                            <Calendar size={14} />
                            {player.matchesPlayed} games
                          </span>
                        </div>
                      </div>
                      <div className="scorer-goals">{player.goals}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
