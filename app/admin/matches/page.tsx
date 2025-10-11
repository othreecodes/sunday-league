'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Trash2, Edit2, Play, CheckCircle, Grid3x3, List } from 'lucide-react'
import './matches.css'

interface Season {
  id: string
  name: string
  isActive: boolean
}

interface Group {
  id: string
  name: string
}

interface Match {
  id: string
  matchDate: string
  location: string | null
  status: string
  homeScore: number
  awayScore: number
  homeGroup: Group
  awayGroup: Group
  season: {
    name: string
  }
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    seasonId: '',
    homeGroupId: '',
    awayGroupId: '',
    matchDate: '',
    location: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [filterSeasonId, setFilterSeasonId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    } else {
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [seasonsRes, matchesRes] = await Promise.all([
        fetch('/api/seasons'),
        fetch('/api/matches')
      ])

      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json()
        setSeasons(seasonsData)

        // Set default season to active one
        const activeSeason = seasonsData.find((s: Season) => s.isActive)
        if (activeSeason) {
          // Set form default
          if (!formData.seasonId) {
            setFormData(prev => ({ ...prev, seasonId: activeSeason.id }))
            // Fetch groups for active season
            fetchGroups(activeSeason.id)
          }
          // Set filter default to active season
          if (filterSeasonId === 'all') {
            setFilterSeasonId(activeSeason.id)
          }
        }
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json()
        setMatches(matchesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async (seasonId: string) => {
    try {
      const res = await fetch(`/api/seasons/${seasonId}`)
      if (res.ok) {
        const season = await res.json()
        setGroups(season.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const handleSeasonChange = (seasonId: string) => {
    setFormData({ ...formData, seasonId, homeGroupId: '', awayGroupId: '' })
    fetchGroups(seasonId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.homeGroupId === formData.awayGroupId) {
      alert('Home and away teams must be different')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonId: formData.seasonId,
          homeGroupId: formData.homeGroupId,
          awayGroupId: formData.awayGroupId,
          matchDate: new Date(formData.matchDate).toISOString(),
          location: formData.location || null
        })
      })

      if (res.ok) {
        setFormData({ seasonId: formData.seasonId, homeGroupId: '', awayGroupId: '', matchDate: '', location: '' })
        setShowForm(false)
        fetchData()
      } else {
        alert('Failed to create match')
      }
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Error creating match')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This will delete all associated goals and cards.')) {
      return
    }

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete match')
      }
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Error deleting match')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string; icon: JSX.Element }> = {
      SCHEDULED: { className: 'status-scheduled', text: 'Scheduled', icon: <FileText size={14} /> },
      IN_PROGRESS: { className: 'status-progress', text: 'Live', icon: <Play size={14} /> },
      COMPLETED: { className: 'status-completed', text: 'Completed', icon: <CheckCircle size={14} /> }
    }
    const badge = badges[status] || badges.SCHEDULED
    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    )
  }

  const filteredMatches = filterSeasonId === 'all'
    ? matches
    : matches.filter(m => m.season.name === seasons.find(s => s.id === filterSeasonId)?.name)

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="matches-container">
      <header className="matches-header">
        <Link href="/admin" className="back-link">
          <ArrowLeft size={20} /> Back to Admin
        </Link>
        <h1><FileText size={28} className="inline-icon" /> Matches Management</h1>
      </header>

      <main className="matches-main">
        <div className="matches-actions">
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={seasons.length === 0}
          >
            <Plus size={20} /> {showForm ? 'Cancel' : 'Schedule New Match'}
          </button>
          {seasons.length === 0 && (
            <p className="warning-text">Please create a season and groups first</p>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="seasonFilter">Filter by Season:</label>
            <select
              id="seasonFilter"
              value={filterSeasonId}
              onChange={(e) => setFilterSeasonId(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="view-switcher">
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <Grid3x3 size={20} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {showForm && (
          <div className="match-form-card">
            <h2>Schedule New Match</h2>
            <form onSubmit={handleSubmit} className="match-form">
              <div className="form-group">
                <label htmlFor="seasonId">Season</label>
                <select
                  id="seasonId"
                  value={formData.seasonId}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  required
                >
                  <option value="">Select a season</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} {season.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="homeGroupId">Home Team</label>
                  <select
                    id="homeGroupId"
                    value={formData.homeGroupId}
                    onChange={(e) => setFormData({ ...formData, homeGroupId: e.target.value })}
                    required
                    disabled={!formData.seasonId}
                  >
                    <option value="">Select home team</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="awayGroupId">Away Team</label>
                  <select
                    id="awayGroupId"
                    value={formData.awayGroupId}
                    onChange={(e) => setFormData({ ...formData, awayGroupId: e.target.value })}
                    required
                    disabled={!formData.seasonId}
                  >
                    <option value="">Select away team</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id} disabled={group.id === formData.homeGroupId}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="matchDate">Match Date & Time</label>
                  <input
                    type="datetime-local"
                    id="matchDate"
                    value={formData.matchDate}
                    onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Venue (Optional)</label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Pitch"
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Scheduling...' : 'Schedule Match'}
              </button>
            </form>
          </div>
        )}

        <div className="matches-list">
          {loading ? (
            <div className="loading">Loading matches...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>{matches.length === 0 ? 'No Matches Yet' : 'No Matches Found'}</h3>
              <p>{matches.length === 0 ? 'Schedule your first match to get started' : 'No matches found for the selected filter'}</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="matches-grid">
              {filteredMatches.map((match) => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    {getStatusBadge(match.status)}
                    <span className="season-badge">{match.season.name}</span>
                  </div>

                  <div className="match-teams">
                    <div className="team home-team">
                      <span className="team-name">{match.homeGroup.name}</span>
                      <span className="team-score">{match.homeScore}</span>
                    </div>
                    <div className="match-vs">vs</div>
                    <div className="team away-team">
                      <span className="team-score">{match.awayScore}</span>
                      <span className="team-name">{match.awayGroup.name}</span>
                    </div>
                  </div>

                  <div className="match-info">
                    <div className="info-item">
                      <span className="info-label">Date:</span>
                      <span>{new Date(match.matchDate).toLocaleString()}</span>
                    </div>
                    {match.location && (
                      <div className="info-item">
                        <span className="info-label">Venue:</span>
                        <span>{match.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="match-actions">
                    {match.status !== 'COMPLETED' && (
                      <Link href={`/admin/matches/${match.id}/record`} className="btn-icon btn-record">
                        <Edit2 size={18} />
                        Record Result
                      </Link>
                    )}
                    <Link href={`/admin/matches/${match.id}`} className="btn-icon btn-view">
                      <FileText size={18} />
                      View Details
                    </Link>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => deleteMatch(match.id)}
                      title="Delete match"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="matches-table">
              <table>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Home Team</th>
                    <th>Score</th>
                    <th>Away Team</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr key={match.id}>
                      <td><span className="season-badge">{match.season.name}</span></td>
                      <td>{match.homeGroup.name}</td>
                      <td className="score-cell">{match.homeScore} - {match.awayScore}</td>
                      <td>{match.awayGroup.name}</td>
                      <td>{new Date(match.matchDate).toLocaleString()}</td>
                      <td>{match.location || '-'}</td>
                      <td>{getStatusBadge(match.status)}</td>
                      <td className="actions-cell">
                        {match.status !== 'COMPLETED' && (
                          <Link href={`/admin/matches/${match.id}/record`} className="btn-icon btn-record">
                            <Edit2 size={16} />
                          </Link>
                        )}
                        <Link href={`/admin/matches/${match.id}`} className="btn-icon btn-view">
                          <FileText size={16} />
                        </Link>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => deleteMatch(match.id)}
                          title="Delete match"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
