'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Trophy, Target, Shield, Calendar, Users, Home, ArrowLeft } from 'lucide-react'
import './profile.css'

interface UserStats {
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  teams: number
  matchesPlayed: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchUserStats()
  }, [session, status, router])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/profile/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <Link href="/" className="back-link">
            <ArrowLeft size={20} />
            Back
          </Link>
          <h1>Profile</h1>
          <Link href="/" className="home-link">
            <Home size={20} />
          </Link>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-icon">
            <User size={64} strokeWidth={1.5} />
          </div>
          <h2>{session.user.name}</h2>
          <p className="profile-email">{session.user.email}</p>
          <div className="profile-badge">
            <Shield size={16} />
            {session.user.role}
          </div>
        </div>

        {loading ? (
          <div className="stats-loading">Loading statistics...</div>
        ) : stats ? (
          <>
            <div className="stats-section">
              <h3>Player Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Target size={32} />
                  </div>
                  <div className="stat-value">{stats.goals}</div>
                  <div className="stat-label">Goals Scored</div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Trophy size={32} />
                  </div>
                  <div className="stat-value">{stats.assists}</div>
                  <div className="stat-label">Assists</div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Calendar size={32} />
                  </div>
                  <div className="stat-value">{stats.matchesPlayed}</div>
                  <div className="stat-label">Matches Played</div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={32} />
                  </div>
                  <div className="stat-value">{stats.teams}</div>
                  <div className="stat-label">Teams</div>
                </div>
              </div>
            </div>

            <div className="cards-section">
              <h3>Disciplinary Record</h3>
              <div className="cards-grid">
                <div className="card-box yellow-card">
                  <div className="card-count">{stats.yellowCards}</div>
                  <div className="card-label">Yellow Cards</div>
                </div>
                <div className="card-box red-card">
                  <div className="card-count">{stats.redCards}</div>
                  <div className="card-label">Red Cards</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-stats">
            <p>No statistics available yet</p>
          </div>
        )}

        <div className="actions-section">
          <Link href="/league" className="action-button">
            <Trophy size={20} />
            View League Table
          </Link>
          {session.user.role === 'ADMIN' && (
            <Link href="/admin" className="action-button admin">
              <Shield size={20} />
              Admin Dashboard
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
