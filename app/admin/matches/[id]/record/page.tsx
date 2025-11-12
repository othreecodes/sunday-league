'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, AlertCircle, CheckCircle, Target } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './record.css'

interface User {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  members: Array<{
    userId: string
    user: User
  }>
}

interface Goal {
  id: string
  scorerId: string
  assistId: string | null
  minute: number
  scorer: User
  assist: User | null
}

interface Card {
  id: string
  userId: string
  cardType: string
  minute: number
  reason: string | null
  user: User
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
  goals: Goal[]
  cards: Card[]
}

export default function RecordMatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const matchId = params?.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalData, setGoalData] = useState({
    scorerId: '',
    assistId: '',
    minute: ''
  })

  // Card form
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardData, setCardData] = useState({
    userId: '',
    cardType: 'YELLOW',
    minute: '',
    reason: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE') {
      router.push('/league')
    } else if (matchId) {
      fetchMatch()
    }
  }, [session, status, router, matchId])

  const fetchMatch = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`)
      if (res.ok) {
        const data = await res.json()
        setMatch(data)
      } else {
        router.push('/admin/matches')
      }
    } catch (error) {
      console.error('Error fetching match:', error)
      router.push('/admin/matches')
    } finally {
      setLoading(false)
    }
  }

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/matches/${matchId}/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scorerId: goalData.scorerId,
          assistId: goalData.assistId || null,
          minute: parseInt(goalData.minute)
        })
      })

      if (res.ok) {
        setGoalData({ scorerId: '', assistId: '', minute: '' })
        setShowGoalForm(false)
        fetchMatch()
      } else {
        alert('Failed to add goal')
      }
    } catch (error) {
      console.error('Error adding goal:', error)
      alert('Error adding goal')
    } finally {
      setSubmitting(false)
    }
  }

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/matches/${matchId}/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cardData.userId,
          cardType: cardData.cardType,
          minute: parseInt(cardData.minute),
          reason: cardData.reason || null
        })
      })

      if (res.ok) {
        setCardData({ userId: '', cardType: 'YELLOW', minute: '', reason: '' })
        setShowCardForm(false)
        fetchMatch()
      } else {
        alert('Failed to add card')
      }
    } catch (error) {
      console.error('Error adding card:', error)
      alert('Error adding card')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const res = await fetch(`/api/matches/${matchId}/goal/${goalId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchMatch()
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      const res = await fetch(`/api/matches/${matchId}/card/${cardId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchMatch()
      }
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const completeMatch = async () => {
    if (!confirm('Mark this match as completed?')) return

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      if (res.ok) {
        router.push('/admin/matches')
      }
    } catch (error) {
      console.error('Error completing match:', error)
    }
  }

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE') || loading) {
    return (
      <div className="mobile-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!match) {
    return (
      <>
        <MobileHeader
          title="Record Match Result"
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

  const allPlayers = [
    ...match.homeGroup.members.map(m => ({ ...m.user, team: match.homeGroup.name })),
    ...match.awayGroup.members.map(m => ({ ...m.user, team: match.awayGroup.name }))
  ]

  return (
    <>
      <MobileHeader
        title="Record Match Result"
        subtitle={`${match.homeGroup.name} vs ${match.awayGroup.name}`}
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={20} />
          </button>
        }
      />

      <MobileContainer>
        <MobileCard padding="large" className="match-overview">
          <div className="overview-teams">
            <div className="overview-team">
              <span className="overview-team-name">{match.homeGroup.name}</span>
              <span className="overview-score">{match.homeScore}</span>
            </div>
            <div className="overview-vs">vs</div>
            <div className="overview-team">
              <span className="overview-score">{match.awayScore}</span>
              <span className="overview-team-name">{match.awayGroup.name}</span>
            </div>
          </div>
          <div className="overview-info">
            <span>{new Date(match.matchDate).toLocaleString()}</span>
            {match.location && <span> • {match.location}</span>}
          </div>
        </MobileCard>

        <div className="record-sections">
          <MobileCard padding="large" className="record-section">
            <div className="section-header">
              <h2>Goals</h2>
              <button className="btn-add" onClick={() => setShowGoalForm(!showGoalForm)}>
                <Plus size={18} /> Add Goal
              </button>
            </div>

            {showGoalForm && (
              <form onSubmit={addGoal} className="event-form">
                <div className="form-group">
                  <label htmlFor="scorer">Goal Scorer *</label>
                  <select
                    id="scorer"
                    value={goalData.scorerId}
                    onChange={(e) => setGoalData({ ...goalData, scorerId: e.target.value })}
                    required
                  >
                    <option value="">Select player</option>
                    {allPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="assist">Assist By</label>
                  <select
                    id="assist"
                    value={goalData.assistId}
                    onChange={(e) => setGoalData({ ...goalData, assistId: e.target.value })}
                  >
                    <option value="">None</option>
                    {allPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="minute">Minute *</label>
                  <input
                    type="number"
                    id="minute"
                    value={goalData.minute}
                    onChange={(e) => setGoalData({ ...goalData, minute: e.target.value })}
                    min="1"
                    max="120"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Goal'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowGoalForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="events-list">
              {match.goals.length === 0 ? (
                <p className="empty-message">No goals recorded yet</p>
              ) : (
                match.goals.map((goal) => (
                  <div key={goal.id} className="event-item">
                    <div className="event-info">
                      <span className="event-minute">{goal.minute}'</span>
                      <span className="event-player">{goal.scorer.name}</span>
                      {goal.assist && (
                        <span className="event-assist">Assist: {goal.assist.name}</span>
                      )}
                    </div>
                    <button
                      className="btn-delete-small"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </MobileCard>

          <MobileCard padding="large" className="record-section">
            <div className="section-header">
              <h2>Cards</h2>
              <button className="btn-add" onClick={() => setShowCardForm(!showCardForm)}>
                <Plus size={18} /> Add Card
              </button>
            </div>

            {showCardForm && (
              <form onSubmit={addCard} className="event-form">
                <div className="form-group">
                  <label htmlFor="player">Player *</label>
                  <select
                    id="player"
                    value={cardData.userId}
                    onChange={(e) => setCardData({ ...cardData, userId: e.target.value })}
                    required
                  >
                    <option value="">Select player</option>
                    {allPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cardType">Card Type *</label>
                  <select
                    id="cardType"
                    value={cardData.cardType}
                    onChange={(e) => setCardData({ ...cardData, cardType: e.target.value })}
                    required
                  >
                    <option value="YELLOW">Yellow Card</option>
                    <option value="RED">Red Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="cardMinute">Minute *</label>
                  <input
                    type="number"
                    id="cardMinute"
                    value={cardData.minute}
                    onChange={(e) => setCardData({ ...cardData, minute: e.target.value })}
                    min="1"
                    max="120"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason</label>
                  <input
                    type="text"
                    id="reason"
                    value={cardData.reason}
                    onChange={(e) => setCardData({ ...cardData, reason: e.target.value })}
                    placeholder="Optional reason"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Card'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowCardForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="events-list">
              {match.cards.length === 0 ? (
                <p className="empty-message">No cards recorded yet</p>
              ) : (
                match.cards.map((card) => (
                  <div key={card.id} className="event-item">
                    <div className="event-info">
                      <span className="event-minute">{card.minute}'</span>
                      <span className={`card-badge card-${card.cardType?.toLowerCase() || 'unknown'}`}>
                        {card.cardType || 'Unknown'}
                      </span>
                      <span className="event-player">{card.user.name}</span>
                      {card.reason && (
                        <span className="event-reason">{card.reason}</span>
                      )}
                    </div>
                    <button
                      className="btn-delete-small"
                      onClick={() => deleteCard(card.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </MobileCard>
        </div>

        {match.status !== 'COMPLETED' && (
          <div className="complete-section">
            <button className="btn-complete" onClick={completeMatch}>
              <CheckCircle size={20} /> Mark Match as Completed
            </button>
            <p className="complete-warning">
              <AlertCircle size={16} /> This will finalize the match result and update league standings
            </p>
          </div>
        )}
      </MobileContainer>
    </>
  )
}
