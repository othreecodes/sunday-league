'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, MapPin, Clock, ChevronLeft, AlertCircle } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './match-detail.css'

interface User {
  id: string
  name: string
}

interface Card {
  id: string
  cardType: 'YELLOW' | 'RED'
  minute: number
  user: User
  groupId: string
}

interface Group {
  id: string
  name: string
  members: Array<{
    user: User
  }>
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
    id: string
    name: string
  }
  cards: Card[]
}

export default function MatchDetail() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (matchId) {
      fetchMatch()
    }
  }, [matchId])

  const fetchMatch = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/matches/${matchId}`)
      if (!response.ok) {
        throw new Error('Match not found')
      }
      const data = await response.json()
      setMatch(data)
    } catch (err) {
      setError('Failed to load match details')
    } finally {
      setLoading(false)
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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCardsByGroup = (groupId: string) => {
    if (!match) return []
    return match.cards.filter(card => card.groupId === groupId)
  }

  if (loading) {
    return (
      <>
        <MobileHeader
          title="Match Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={24} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading match details...</p>
          </div>
        </MobileContainer>
      </>
    )
  }

  if (error || !match) {
    return (
      <>
        <MobileHeader
          title="Match Details"
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
            <h3 className="mobile-empty-title">Match not found</h3>
            <p className="mobile-empty-description">
              {error || 'The match you are looking for does not exist'}
            </p>
          </div>
        </MobileContainer>
      </>
    )
  }

  return (
    <>
      <MobileHeader
        title="Match Details"
        subtitle={match.season.name}
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <MobileContainer>
        {/* Status Badge */}
        <div className="match-status-section">
          {getStatusBadge(match.status)}
          {match.status === 'IN_PROGRESS' && (
            <span className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </span>
          )}
        </div>

        {/* Score Card */}
        <MobileCard padding="large" className="score-card">
          <div className="score-display">
            {/* Home Team */}
            <div className="team-section home-section">
              <h2 className="team-name-large">{match.homeGroup.name}</h2>
              <span className="team-label">Home</span>
            </div>

            {/* Score */}
            <div className="score-section">
              <div className="score-container">
                <span className="score-value">{match.homeScore}</span>
                <span className="score-separator">-</span>
                <span className="score-value">{match.awayScore}</span>
              </div>
              {match.status === 'COMPLETED' && (
                <span className="full-time-label">FT</span>
              )}
            </div>

            {/* Away Team */}
            <div className="team-section away-section">
              <h2 className="team-name-large">{match.awayGroup.name}</h2>
              <span className="team-label">Away</span>
            </div>
          </div>
        </MobileCard>

        {/* Match Info */}
        <MobileCard padding="medium">
          <div className="match-info-section">
            <div className="info-item">
              <Calendar size={20} />
              <div className="info-content">
                <span className="info-label">Date</span>
                <span className="info-value">{formatDate(match.matchDate)}</span>
              </div>
            </div>
            <div className="info-item">
              <Clock size={20} />
              <div className="info-content">
                <span className="info-label">Time</span>
                <span className="info-value">{formatTime(match.matchDate)}</span>
              </div>
            </div>
            {match.location && (
              <div className="info-item">
                <MapPin size={20} />
                <div className="info-content">
                  <span className="info-label">Location</span>
                  <span className="info-value">{match.location}</span>
                </div>
              </div>
            )}
          </div>
        </MobileCard>

        {/* Cards Section */}
        {match.cards.length > 0 && (
          <div className="mobile-section">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">
                <AlertCircle size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Cards
              </h2>
              <span className="match-count">{match.cards.length}</span>
            </div>

            <MobileCard padding="none">
              <div className="events-list">
                {match.cards.map((card) => {
                  const isHome = card.groupId === match.homeGroup.id
                  return (
                    <div
                      key={card.id}
                      className={`event-item card-event ${card.cardType?.toLowerCase() || 'unknown'}-card ${!isHome ? 'away-event' : ''}`}
                    >
                      <div className="event-minute">{card.minute}'</div>
                      <div className="event-icon">
                        <div className={`card-icon ${card.cardType?.toLowerCase() || 'unknown'}`}></div>
                      </div>
                      <div className="event-details">
                        <span className="event-player">{card.user.name}</span>
                        <span className="event-secondary">{card.cardType || 'Unknown'} Card</span>
                        <span className="event-team">
                          {isHome ? match.homeGroup.name : match.awayGroup.name}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </MobileCard>
          </div>
        )}

        {/* Squads Section */}
        <div className="mobile-section">
          <div className="squads-container">
            {/* Home Squad */}
            <MobileCard padding="medium" className="squad-card">
              <h3 className="squad-title">{match.homeGroup.name}</h3>
              <div className="squad-list">
                {match.homeGroup.members.map((member, index) => (
                  <div key={member.user.id} className="squad-member">
                    <span className="squad-number">{index + 1}</span>
                    <span className="squad-name">{member.user.name}</span>
                  </div>
                ))}
              </div>
            </MobileCard>

            {/* Away Squad */}
            <MobileCard padding="medium" className="squad-card">
              <h3 className="squad-title">{match.awayGroup.name}</h3>
              <div className="squad-list">
                {match.awayGroup.members.map((member, index) => (
                  <div key={member.user.id} className="squad-member">
                    <span className="squad-number">{index + 1}</span>
                    <span className="squad-name">{member.user.name}</span>
                  </div>
                ))}
              </div>
            </MobileCard>
          </div>
        </div>
      </MobileContainer>
    </>
  )
}
