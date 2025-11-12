'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trophy, Calendar, MapPin, Users, Target, Edit2, AlertCircle } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './match-detail.css'

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
  season: {
    id: string
    name: string
  }
  goals: Array<{
    id: string
    minute: number | null
    scorer: {
      id: string
      name: string
    }
    assist: {
      id: string
      name: string
    } | null
  }>
  cards: Array<{
    id: string
    cardType: string
    minute: number | null
    reason: string | null
    user: {
      id: string
      name: string
    }
  }>
}

export default function MatchDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const matchId = params?.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE') {
      router.push('/league')
    } else {
      fetchMatch()
    }
  }, [session, status, router, matchId])

  const fetchMatch = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`)
      if (res.ok) {
        const data = await res.json()
        setMatch(data)
      }
    } catch (error) {
      console.error('Error fetching match:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE')) {
    return (
      <div className="mobile-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <MobileHeader
          title="Match Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={20} />
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

  if (!match) {
    return (
      <>
        <MobileHeader
          title="Match Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={20} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <AlertCircle size={64} />
            </div>
            <h3 className="mobile-empty-title">Match not found</h3>
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
            <ChevronLeft size={20} />
          </button>
        }
        rightAction={
          match.status !== 'COMPLETED' ? (
            <Link href={`/admin/matches/${match.id}/record`} className="add-btn">
              <Edit2 size={20} />
            </Link>
          ) : null
        }
      />

      <MobileContainer>
        <MobileCard padding="large" className="match-info-card">
          <div className="info-header">
            <span className={`status-badge status-${match.status.toLowerCase()}`}>
              {match.status}
            </span>
          </div>

          <div className="match-score">
            <div className="team home">
              <h2>{match.homeGroup.name}</h2>
              <div className="score">{match.homeScore}</div>
            </div>
            <div className="vs">VS</div>
            <div className="team away">
              <div className="score">{match.awayScore}</div>
              <h2>{match.awayGroup.name}</h2>
            </div>
          </div>

          <div className="match-meta">
            <div className="meta-item">
              <Calendar size={16} />
              <span>{new Date(match.matchDate).toLocaleString()}</span>
            </div>
            {match.location && (
              <div className="meta-item">
                <MapPin size={16} />
                <span>{match.location}</span>
              </div>
            )}
          </div>

          {match.status !== 'COMPLETED' && (
            <div className="actions">
              <Link href={`/admin/matches/${match.id}/record`} className="btn-primary">
                <Edit2 size={20} />
                Record Match Result
              </Link>
            </div>
          )}
        </MobileCard>

        {match.goals.length > 0 && (
          <div className="mobile-section">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">
                <Target size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Goals
              </h2>
              <span className="match-count">{match.goals.length}</span>
            </div>
            <MobileCard padding="none" className="events-card">
              <div className="events-list">
                {match.goals.map((goal) => (
                  <div key={goal.id} className="event-item goal">
                    <div className="event-minute">{goal.minute}'</div>
                    <div className="event-details">
                      <div className="event-player">{goal.scorer.name}</div>
                      {goal.assist && (
                        <div className="event-assist">Assist: {goal.assist.name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </MobileCard>
          </div>
        )}

        {match.cards.length > 0 && (
          <div className="mobile-section">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">
                <AlertCircle size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Cards
              </h2>
              <span className="match-count">{match.cards.length}</span>
            </div>
            <MobileCard padding="none" className="events-card">
              <div className="events-list">
                {match.cards.map((card) => (
                  <div key={card.id} className={`event-item card ${card.cardType.toLowerCase()}`}>
                    <div className="event-minute">{card.minute}'</div>
                    <div className="event-details">
                      <div className="event-player">{card.user.name}</div>
                      <div className={`card-badge ${card.cardType.toLowerCase()}`}>
                        {card.cardType} CARD
                      </div>
                      {card.reason && (
                        <div className="event-reason">{card.reason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </MobileCard>
          </div>
        )}

        {match.goals.length === 0 && match.cards.length === 0 && match.status === 'SCHEDULED' && (
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <Target size={64} />
            </div>
            <h3 className="mobile-empty-title">No Events Yet</h3>
            <p className="mobile-empty-description">Record the match result to add goals and cards</p>
          </div>
        )}
      </MobileContainer>
    </>
  )
}
