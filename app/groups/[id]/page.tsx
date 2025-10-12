'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Users, Calendar, Trophy, Target, AlertCircle } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './group-detail.css'

interface User {
  id: string
  name: string
  email: string
}

interface Member {
  id: string
  role: string
  user: User
}

interface Match {
  id: string
  matchDate: string
  location: string | null
  status: string
  homeScore: number
  awayScore: number
  homeGroup: {
    id: string
    name: string
  }
  awayGroup: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  name: string
  season: {
    id: string
    name: string
  }
  members: Member[]
  _count: {
    members: number
    homeMatches: number
    awayMatches: number
  }
}

export default function GroupDetail() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (groupId) {
      fetchGroup()
      fetchMatches()
    }
  }, [groupId])

  const fetchGroup = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) {
        throw new Error('Group not found')
      }
      const data = await response.json()
      setGroup(data)
    } catch (err) {
      setError('Failed to load group details')
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    setMatchesLoading(true)

    try {
      const response = await fetch('/api/matches')
      const data = await response.json()

      // Filter matches for this group (home or away)
      const groupMatches = data.filter((match: Match) =>
        match.homeGroup.id === groupId || match.awayGroup.id === groupId
      )

      // Sort by date (newest first) and take only the most recent 5
      const sortedMatches = groupMatches.sort((a: Match, b: Match) =>
        new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      ).slice(0, 5)

      setMatches(sortedMatches)
    } catch (err) {
      console.error('Failed to load matches:', err)
    } finally {
      setMatchesLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      SCHEDULED: { className: 'status-scheduled', text: 'Scheduled' },
      IN_PROGRESS: { className: 'status-live', text: 'Live' },
      COMPLETED: { className: 'status-completed', text: 'FT' }
    }
    const badge = badges[status] || badges.SCHEDULED
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>
  }

  if (loading) {
    return (
      <>
        <MobileHeader
          title="Group Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={24} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading group details...</p>
          </div>
        </MobileContainer>
      </>
    )
  }

  if (error || !group) {
    return (
      <>
        <MobileHeader
          title="Group Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={24} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <AlertCircle size={64} />
            </div>
            <h3 className="mobile-empty-title">Group not found</h3>
            <p className="mobile-empty-description">
              {error || 'The group you are looking for does not exist'}
            </p>
          </div>
        </MobileContainer>
      </>
    )
  }

  const totalMatches = group._count.homeMatches + group._count.awayMatches

  return (
    <>
      <MobileHeader
        title={group.name}
        subtitle={group.season.name}
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <MobileContainer>
        {/* Stats Cards */}
        <div className="stats-grid">
          <MobileCard padding="medium" className="stat-card">
            <div className="stat-card-content">
              <Users size={24} className="stat-icon" />
              <div className="stat-info">
                <div className="stat-value">{group._count.members}</div>
                <div className="stat-label">Members</div>
              </div>
            </div>
          </MobileCard>

          <MobileCard padding="medium" className="stat-card">
            <div className="stat-card-content">
              <Trophy size={24} className="stat-icon" />
              <div className="stat-info">
                <div className="stat-value">{totalMatches}</div>
                <div className="stat-label">Matches</div>
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Recent Matches Section */}
        <div className="mobile-section">
          <div className="mobile-section-header">
            <h2 className="mobile-section-title">
              <Trophy size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Recent Matches
            </h2>
            {matches.length > 0 && (
              <button
                onClick={() => router.push(`/matches?team=${groupId}`)}
                className="mobile-section-action"
              >
                View All
              </button>
            )}
          </div>

          {matchesLoading ? (
            <div className="mobile-loading">
              <div className="spinner" />
              <p>Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="mobile-empty-state">
              <div className="mobile-empty-icon">
                <Trophy size={64} />
              </div>
              <h3 className="mobile-empty-title">No matches yet</h3>
              <p className="mobile-empty-description">
                This team hasn't played any matches
              </p>
            </div>
          ) : (
            <div className="mobile-card-list">
              {matches.map((match) => {
                const isHome = match.homeGroup.id === groupId
                const opponent = isHome ? match.awayGroup.name : match.homeGroup.name
                const score = `${match.homeScore} - ${match.awayScore}`

                return (
                  <MobileCard
                    key={match.id}
                    padding="medium"
                    onClick={() => router.push(`/matches/${match.id}`)}
                  >
                    <div className="match-card-compact">
                      <div className="match-header-compact">
                        {getStatusBadge(match.status)}
                        <span className="match-date-compact">{formatDate(match.matchDate)}</span>
                      </div>
                      <div className="match-result-compact">
                        <div className="match-vs-compact">
                          <span className="team-label-compact">{isHome ? 'vs' : '@'}</span>
                          <span className="opponent-name-compact">{opponent}</span>
                        </div>
                        {match.status === 'COMPLETED' && (
                          <span className="score-compact">{score}</span>
                        )}
                      </div>
                    </div>
                  </MobileCard>
                )
              })}
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="mobile-section">
          <div className="mobile-section-header">
            <h2 className="mobile-section-title">
              <Users size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Team Members
            </h2>
            <span className="match-count">{group.members.length}</span>
          </div>

          {group.members.length === 0 ? (
            <div className="mobile-empty-state">
              <div className="mobile-empty-icon">
                <Users size={64} />
              </div>
              <h3 className="mobile-empty-title">No members yet</h3>
              <p className="mobile-empty-description">
                This group doesn't have any members
              </p>
            </div>
          ) : (
            <MobileCard padding="none">
              <div className="members-list">
                {group.members.map((member, index) => (
                  <div key={member.id} className="member-item">
                    <div className="member-number">{index + 1}</div>
                    <div className="member-details">
                      <span className="member-name">{member.user.name}</span>
                      {member.role === 'CAPTAIN' && (
                        <span className="member-role">
                          <Trophy size={14} />
                          Captain
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </MobileCard>
          )}
        </div>
      </MobileContainer>
    </>
  )
}
