'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import RefreshIndicator from '@/components/RefreshIndicator'
import { useCachedData } from '@/hooks/useCachedData'
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
  season: { name: string }
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'SCHEDULED', label: 'Upcoming' },
  { value: 'IN_PROGRESS', label: 'Live' },
  { value: 'COMPLETED', label: 'Results' }
]

function MatchesContent() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [allGroups, setAllGroups] = useState<Group[]>([])

  const fetchMatchesData = useCallback(async (): Promise<Match[]> => {
    const response = await fetch('/api/matches')
    if (!response.ok) throw new Error('Failed to load matches')
    return response.json()
  }, [])

  const { data: matches, loading, refreshing } = useCachedData<Match[]>(fetchMatchesData, {
    cacheKey: 'matches',
    cacheDuration: 3 * 60 * 1000
  })

  // Admins and referees manage matches rather than browse them.
  useEffect(() => {
    if (status === 'loading') return
    if (session?.user.role === 'ADMIN' || session?.user.role === 'REFEREE') {
      router.replace('/admin/matches')
    }
  }, [session, status, router])

  useEffect(() => {
    const load = async () => {
      try {
        const [seasonsRes, groupsRes] = await Promise.all([
          fetch('/api/seasons'),
          fetch('/api/groups')
        ])
        const data: Season[] = await seasonsRes.json()
        setAllGroups(await groupsRes.json())
        setSeasons(data)

        const active = data.find((s) => s.isActive)
        setSelectedSeason(active ? active.id : data[0]?.id || '')
      } catch (err) {
        console.error('Failed to load seasons:', err)
      }
    }
    load()
  }, [])

  useEffect(() => {
    setTeamFilter('all')
  }, [selectedSeason])

  const availableGroups = allGroups.filter((g) => g.seasonId === selectedSeason)
  const selectedSeasonData = seasons.find((s) => s.id === selectedSeason)

  const filteredMatches = (matches || [])
    .filter((m) => (selectedSeasonData ? m.season.name === selectedSeasonData.name : true))
    .filter((m) =>
      teamFilter === 'all' ? true : m.homeGroup.id === teamFilter || m.awayGroup.id === teamFilter
    )
    .filter((m) => (statusFilter === 'all' ? true : m.status === statusFilter))
    .sort((a, b) => +new Date(b.matchDate) - +new Date(a.matchDate))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.round(
      (new Date(date.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 86400000
    )
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const getStatusBadge = (matchStatus: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      SCHEDULED: { className: 'status-scheduled', text: 'Scheduled' },
      IN_PROGRESS: { className: 'status-live', text: 'Live' },
      COMPLETED: { className: 'status-completed', text: 'Full time' },
      CANCELLED: { className: 'status-cancelled', text: 'Cancelled' }
    }
    const badge = badges[matchStatus] || badges.SCHEDULED
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>
  }

  return (
    <>
      <MobileHeader
        title="Matches"
        eyebrow="Fixtures & results"
        subtitle={selectedSeasonData?.name}
        rightAction={<RefreshIndicator isRefreshing={refreshing} />}
      />

      <MobileContainer>
        {/* ------------------------------------------------------------ */}
        {/* Filters                                                      */}
        {/* ------------------------------------------------------------ */}
        <div className="match-filters">
          <div className="segmented" role="tablist" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                role="tab"
                aria-selected={statusFilter === f.value}
                className={`segmented-item ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="filter-selects">
            {seasons.length > 1 && (
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="filter-select"
                aria-label="Season"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                    {season.isActive ? ' · current' : ''}
                  </option>
                ))}
              </select>
            )}

            {availableGroups.length > 0 && (
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="filter-select"
                aria-label="Team"
              >
                <option value="all">All teams</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Match list                                                   */}
        {/* ------------------------------------------------------------ */}
        {loading && !matches ? (
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading matches…</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <Calendar />
            </div>
            <h3 className="mobile-empty-title">Nothing here yet</h3>
            <p className="mobile-empty-description">
              {statusFilter === 'all'
                ? 'No matches for this season yet.'
                : `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()} matches for this filter.`}
            </p>
          </div>
        ) : (
          <div className="mobile-section">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
              </h2>
            </div>

            <div className="auto-grid">
              {filteredMatches.map((match) => {
                const played = match.status === 'COMPLETED' || match.status === 'IN_PROGRESS'
                const homeWin = played && match.homeScore > match.awayScore
                const awayWin = played && match.awayScore > match.homeScore

                return (
                  <MobileCard
                    key={match.id}
                    padding="medium"
                    onClick={() => router.push(`/matches/${match.id}`)}
                    className="match-card-wrap"
                  >
                    <div className="match-card">
                      <div className="match-card-top">
                        {getStatusBadge(match.status)}
                        <ChevronRight size={16} className="match-go" />
                      </div>

                      <div className="match-line">
                        <span className={`match-team ${homeWin ? 'won' : ''}`}>
                          {match.homeGroup.name}
                        </span>
                        <span className="match-figures">
                          {played ? (
                            <>
                              <span className={`match-num ${homeWin ? 'won' : ''}`}>
                                {match.homeScore}
                              </span>
                              <span className="match-sep">–</span>
                              <span className={`match-num ${awayWin ? 'won' : ''}`}>
                                {match.awayScore}
                              </span>
                            </>
                          ) : (
                            <span className="match-vs">vs</span>
                          )}
                        </span>
                        <span className={`match-team match-team-away ${awayWin ? 'won' : ''}`}>
                          {match.awayGroup.name}
                        </span>
                      </div>

                      <div className="match-meta">
                        <span>
                          <Calendar size={13} />
                          {formatDate(match.matchDate)}
                        </span>
                        <span>
                          <Clock size={13} />
                          {formatTime(match.matchDate)}
                        </span>
                        {match.location && (
                          <span className="match-meta-location">
                            <MapPin size={13} />
                            {match.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </MobileCard>
                )
              })}
            </div>
          </div>
        )}
      </MobileContainer>
    </>
  )
}

export default function Matches() {
  return (
    <Suspense
      fallback={
        <div className="mobile-loading">
          <div className="spinner" />
          <p>Loading…</p>
        </div>
      }
    >
      <MatchesContent />
    </Suspense>
  )
}
