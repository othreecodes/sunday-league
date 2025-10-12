'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, FileText, Trash2, Edit2, Play, CheckCircle, LayoutGrid, List } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
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
  const [filterTeamId, setFilterTeamId] = useState<string>('all')
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

        // Collect all groups from all seasons
        const allGroupsData: Group[] = []
        seasonsData.forEach((season: any) => {
          if (season.groups) {
            allGroupsData.push(...season.groups)
          }
        })
        setAllGroups(allGroupsData)

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

  let filteredMatches = matches

  // Filter by season
  if (filterSeasonId !== 'all') {
    const seasonName = seasons.find(s => s.id === filterSeasonId)?.name
    filteredMatches = filteredMatches.filter(m => m.season.name === seasonName)
  }

  // Filter by team
  if (filterTeamId !== 'all') {
    filteredMatches = filteredMatches.filter(m =>
      m.homeGroup.id === filterTeamId || m.awayGroup.id === filterTeamId
    )
  }

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="mobile-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      <MobileHeader
        title="Matches"
        subtitle="Manage all matches"
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={20} />
          </button>
        }
        rightAction={
          <button
            className="add-btn"
            onClick={() => setShowForm(!showForm)}
            disabled={seasons.length === 0}
          >
            <Plus size={20} />
          </button>
        }
      />

      <MobileContainer>
        {/* Warning if no seasons */}
        {seasons.length === 0 && (
          <div className="mobile-warning">
            <p>Please create a season and groups first</p>
          </div>
        )}

        {/* Filter and View Toggle */}
        <MobileCard padding="medium" className="filter-card">
          <div className="filter-container">
            <div className="filter-row">
              <div className="filter-select-wrapper">
                <label className="filter-label">Season</label>
                <select
                  value={filterSeasonId}
                  onChange={(e) => setFilterSeasonId(e.target.value)}
                  className="season-filter-select"
                >
                  <option value="all">All Seasons</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} {season.isActive ? '⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <label className="filter-label">Team</label>
                <select
                  value={filterTeamId}
                  onChange={(e) => setFilterTeamId(e.target.value)}
                  className="team-filter-select"
                >
                  <option value="all">All Teams</option>
                  {allGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={20} />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </MobileCard>

        {showForm && (
          <MobileCard padding="large" className="match-form-card">
            <h2 className="form-title">Schedule New Match</h2>
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
          </MobileCard>
        )}

        {/* Matches List */}
        {loading ? (
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <FileText size={64} />
            </div>
            <h3 className="mobile-empty-title">
              {matches.length === 0 ? 'No Matches Yet' : 'No Matches Found'}
            </h3>
            <p className="mobile-empty-description">
              {matches.length === 0 ? 'Schedule your first match to get started' : 'No matches found for the selected filter'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <MobileCard padding="none" className="matches-table-card">
            <div className="matches-table-wrapper">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th className="col-teams">Match</th>
                    <th className="col-date">Date</th>
                    <th className="col-status">Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr key={match.id} className="table-row">
                      <td className="col-teams">
                        <div className="match-teams-table">
                          <span className="team-name-table">{match.homeGroup.name}</span>
                          <span className="score-table">{match.homeScore} - {match.awayScore}</span>
                          <span className="team-name-table">{match.awayGroup.name}</span>
                        </div>
                        <span className="season-badge-small">{match.season.name}</span>
                      </td>
                      <td className="col-date">
                        <span className="date-text">{new Date(match.matchDate).toLocaleDateString()}</span>
                      </td>
                      <td className="col-status">{getStatusBadge(match.status)}</td>
                      <td className="col-actions">
                        <div className="actions-group">
                          {match.status !== 'COMPLETED' && (
                            <Link href={`/admin/matches/${match.id}/record`} className="action-btn btn-record">
                              <Edit2 size={16} />
                            </Link>
                          )}
                          <Link href={`/admin/matches/${match.id}`} className="action-btn btn-view">
                            <FileText size={16} />
                          </Link>
                          <button
                            className="action-btn btn-delete"
                            onClick={() => deleteMatch(match.id)}
                            title="Delete match"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MobileCard>
        ) : (
          <div className="mobile-card-list">
            {filteredMatches.map((match) => (
              <MobileCard key={match.id} padding="medium">
                <div className="match-card">
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
                      <span>{new Date(match.matchDate).toLocaleDateString()}</span>
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
                      <Link href={`/admin/matches/${match.id}/record`} className="btn-action btn-record">
                        <Edit2 size={18} />
                        Record Result
                      </Link>
                    )}
                    <Link href={`/admin/matches/${match.id}`} className="btn-action btn-view">
                      <FileText size={18} />
                      View Details
                    </Link>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => deleteMatch(match.id)}
                      title="Delete match"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileContainer>
    </>
  )
}
