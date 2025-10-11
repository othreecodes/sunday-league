'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Target } from 'lucide-react'
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
    } else if (session.user.role !== 'ADMIN') {
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

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading match details...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="loading-container">
        <div className="error-box">Match not found</div>
      </div>
    )
  }

  return (
    <div className="match-detail-container">
      <header className="match-detail-header">
        <Link href="/admin/matches" className="back-link">
          <ArrowLeft size={20} /> Back to Matches
        </Link>
        <h1><Trophy size={28} className="inline-icon" /> Match Details</h1>
      </header>

      <main className="match-detail-main">
        <div className="match-info-card">
          <div className="info-header">
            <span className="season-badge">{match.season.name}</span>
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
                <Target size={20} />
                Record Match Result
              </Link>
            </div>
          )}
        </div>

        {match.goals.length > 0 && (
          <div className="events-card">
            <h3>
              <Target size={24} />
              Goals ({match.goals.length})
            </h3>
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
          </div>
        )}

        {match.cards.length > 0 && (
          <div className="events-card">
            <h3>
              <Users size={24} />
              Cards ({match.cards.length})
            </h3>
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
          </div>
        )}

        {match.goals.length === 0 && match.cards.length === 0 && match.status === 'SCHEDULED' && (
          <div className="empty-events">
            <Target size={48} />
            <h3>No Events Yet</h3>
            <p>Record the match result to add goals and cards</p>
          </div>
        )}
      </main>
    </div>
  )
}
