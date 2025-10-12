'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Clock, Trophy, RefreshCw, Filter } from 'lucide-react'
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
  seasonId: string
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

function MatchesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [teamName, setTeamName] = useState<string>('')

  // Redirect admin and referee users to admin matches view
  useEffect(() => {
    if (status === 'loading') return
    if (session?.user.role === 'ADMIN' || session?.user.role === 'REFEREE') {
      router.replace('/admin/matches')
    }
  }, [session, status, router])

  useEffect(() => {
    fetchSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      fetchMatches()
      // Reset team filter when season changes
      setTeamFilter('all')
    }
  }, [selectedSeason])

  useEffect(() => {
    filterMatches()
  }, [matches, statusFilter, teamFilter, selectedSeason])

  // Filter groups by selected season
  const availableGroups = allGroups.filter(group => group.seasonId === selectedSeason)

  const fetchSeasons = async () => {
    try {
      const [seasonsRes, groupsRes] = await Promise.all([
        fetch('/api/seasons'),
        fetch('/api/groups')
      ])

      const data = await seasonsRes.json()
      const groupsData = await groupsRes.json()

      setSeasons(data)
      setAllGroups(groupsData)

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

  const fetchMatches = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/matches')
      const data = await response.json()
      setMatches(data)
    } catch (err) {
      setError('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = () => {
    let filtered = matches

    // Filter by season
    const selectedSeasonData = seasons.find(s => s.id === selectedSeason)
    if (selectedSeasonData) {
      filtered = filtered.filter(m => m.season.name === selectedSeasonData.name)
    }

    // Filter by team
    if (teamFilter !== 'all') {
      filtered = filtered.filter(m =>
        m.homeGroup.id === teamFilter || m.awayGroup.id === teamFilter
      )

      // Set team name for display
      if (filtered.length > 0) {
        const match = filtered[0]
        const name = match.homeGroup.id === teamFilter
          ? match.homeGroup.name
          : match.awayGroup.name
        setTeamName(name)
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())

    setFilteredMatches(filtered)
  }

  const handleRefresh = () => {
    if (selectedSeason) {
      fetchMatches()
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      SCHEDULED: { className: 'status-scheduled', text: 'Scheduled' },
      IN_PROGRESS: { className: 'status-live', text: 'Live' },
      COMPLETED: { className: 'status-completed', text: 'Full Time' }
    }
    const badge = badges[status] || badges.SCHEDULED
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    if (isYesterday) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const selectedSeasonData = seasons.find(s => s.id === selectedSeason)

  return (
    <>
      <MobileHeader
        title="Matches"
        subtitle={selectedSeasonData?.name}
        rightAction={
          <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
        }
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

        {/* Filters */}
        <MobileCard padding="medium" className="status-filter-card">
          <div className="status-filter-content">
            <Filter size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter-select"
            >
              <option value="all">All Matches</option>
              <option value="SCHEDULED">Upcoming</option>
              <option value="IN_PROGRESS">Live</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </MobileCard>

        {/* Team Filter */}
        {availableGroups.length > 0 && (
          <MobileCard padding="medium" className="status-filter-card">
            <div className="status-filter-content">
              <Filter size={20} />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="status-filter-select"
              >
                <option value="all">All Teams</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </MobileCard>
        )}

        {error && (
          <div className="mobile-error-message">{error}</div>
        )}

        {loading ? (
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading matches...</p>
          </div>
        ) : (
          <>
            {filteredMatches.length === 0 ? (
              <div className="mobile-empty-state">
                <div className="mobile-empty-icon">
                  <Trophy size={64} />
                </div>
                <h3 className="mobile-empty-title">No matches found</h3>
                <p className="mobile-empty-description">
                  {statusFilter !== 'all'
                    ? `No ${statusFilter.toLowerCase()} matches for this season`
                    : 'No matches scheduled for this season yet'}
                </p>
              </div>
            ) : (
              <div className="mobile-section">
                <div className="mobile-section-header">
                  <h2 className="mobile-section-title">
                    {teamFilter !== 'all' ? (
                      <span>
                        {teamName || 'Team'} Matches
                      </span>
                    ) : (
                      <>
                        {statusFilter === 'all' && 'All Matches'}
                        {statusFilter === 'SCHEDULED' && 'Upcoming Matches'}
                        {statusFilter === 'IN_PROGRESS' && 'Live Matches'}
                        {statusFilter === 'COMPLETED' && 'Completed Matches'}
                      </>
                    )}
                  </h2>
                  <span className="match-count">{filteredMatches.length}</span>
                </div>

                <div className="mobile-card-list">
                  {filteredMatches.map((match) => (
                    <MobileCard
                      key={match.id}
                      padding="medium"
                      onClick={() => router.push(`/matches/${match.id}`)}
                    >
                      <div className="match-card">
                        {/* Status Badge */}
                        <div className="match-card-status">
                          {getStatusBadge(match.status)}
                          {match.status === 'IN_PROGRESS' && (
                            <span className="live-indicator">
                              <span className="live-dot"></span>
                              LIVE
                            </span>
                          )}
                        </div>

                        {/* Teams and Score */}
                        <div className="match-teams">
                          <div className="team home-team">
                            <div className="team-info-left">
                              <span className="team-name">{match.homeGroup.name}</span>
                              <span className="team-label">Home</span>
                            </div>
                            <div className="team-score">{match.homeScore}</div>
                          </div>

                          <div className="match-separator">
                            <div className="separator-line"></div>
                            <span className="separator-text">vs</span>
                            <div className="separator-line"></div>
                          </div>

                          <div className="team away-team">
                            <div className="team-score">{match.awayScore}</div>
                            <div className="team-info-right">
                              <span className="team-name">{match.awayGroup.name}</span>
                              <span className="team-label">Away</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Details */}
                        <div className="match-details">
                          <div className="detail-item">
                            <Calendar size={16} />
                            <span>{formatDate(match.matchDate)}</span>
                          </div>
                          <div className="detail-item">
                            <Clock size={16} />
                            <span>{formatTime(match.matchDate)}</span>
                          </div>
                          {match.location && (
                            <div className="detail-item">
                              <MapPin size={16} />
                              <span>{match.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </MobileContainer>
    </>
  )
}

export default function Matches() {
  return (
    <Suspense fallback={
      <div className="mobile-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  )
}
