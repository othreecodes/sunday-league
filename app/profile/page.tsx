'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Trophy, Target, Shield, Calendar, Users, LogOut, ChevronRight } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  if (status === 'loading' || !session) {
    return (
      <>
        <MobileHeader title="Profile" />
        <MobileContainer>
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        </MobileContainer>
      </>
    )
  }

  return (
    <>
      <MobileHeader
        title="Profile"
        subtitle={session.user.name}
      />

      <MobileContainer>
        {/* Profile Info Card */}
        <MobileCard padding="large" className="profile-info-card">
          <div className="profile-avatar">
            <User size={64} strokeWidth={1.5} />
          </div>
          <h2 className="profile-name">{session.user.name}</h2>
          <p className="profile-email">{session.user.email}</p>
          <div className="profile-role-badge">
            <Shield size={16} />
            <span>{session.user.role}</span>
          </div>
        </MobileCard>

        {/* Player Statistics */}
        {loading ? (
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading statistics...</p>
          </div>
        ) : stats ? (
          <>
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">Statistics</h2>
              </div>

              <div className="stats-grid-ios">
                <MobileCard padding="medium" className="stat-card-ios">
                  <div className="stat-icon-ios">
                    <Target size={24} className="stat-icon-color-green" />
                  </div>
                  <div className="stat-info-ios">
                    <div className="stat-value-ios">{stats.goals}</div>
                    <div className="stat-label-ios">Goals</div>
                  </div>
                </MobileCard>

                <MobileCard padding="medium" className="stat-card-ios">
                  <div className="stat-icon-ios">
                    <Trophy size={24} className="stat-icon-color-blue" />
                  </div>
                  <div className="stat-info-ios">
                    <div className="stat-value-ios">{stats.assists}</div>
                    <div className="stat-label-ios">Assists</div>
                  </div>
                </MobileCard>

                <MobileCard padding="medium" className="stat-card-ios">
                  <div className="stat-icon-ios">
                    <Calendar size={24} className="stat-icon-color-blue" />
                  </div>
                  <div className="stat-info-ios">
                    <div className="stat-value-ios">{stats.matchesPlayed}</div>
                    <div className="stat-label-ios">Matches</div>
                  </div>
                </MobileCard>

                <MobileCard padding="medium" className="stat-card-ios">
                  <div className="stat-icon-ios">
                    <Users size={24} className="stat-icon-color-blue" />
                  </div>
                  <div className="stat-info-ios">
                    <div className="stat-value-ios">{stats.teams}</div>
                    <div className="stat-label-ios">Teams</div>
                  </div>
                </MobileCard>
              </div>
            </div>

            {/* Disciplinary Record */}
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">Disciplinary Record</h2>
              </div>

              <div className="cards-grid-ios">
                <MobileCard padding="medium" className="card-stat-yellow">
                  <div className="card-stat-value">{stats.yellowCards}</div>
                  <div className="card-stat-label">Yellow Cards</div>
                </MobileCard>

                <MobileCard padding="medium" className="card-stat-red">
                  <div className="card-stat-value">{stats.redCards}</div>
                  <div className="card-stat-label">Red Cards</div>
                </MobileCard>
              </div>
            </div>
          </>
        ) : (
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <Trophy size={64} />
            </div>
            <h3 className="mobile-empty-title">No Statistics Yet</h3>
            <p className="mobile-empty-description">
              Play your first match to see your stats
            </p>
          </div>
        )}

        {/* Actions Section */}
        <div className="mobile-section">
          <MobileCard padding="none">
            <div className="action-list">
              <Link href="/league" className="action-item">
                <div className="action-icon-wrapper">
                  <Trophy size={20} />
                </div>
                <span className="action-text">View League Table</span>
                <ChevronRight size={20} className="action-chevron" />
              </Link>

              {session.user.role === 'ADMIN' && (
                <Link href="/admin" className="action-item">
                  <div className="action-icon-wrapper admin-icon">
                    <Shield size={20} />
                  </div>
                  <span className="action-text">Admin Dashboard</span>
                  <ChevronRight size={20} className="action-chevron" />
                </Link>
              )}

              <button onClick={handleSignOut} className="action-item action-button-logout">
                <div className="action-icon-wrapper logout-icon">
                  <LogOut size={20} />
                </div>
                <span className="action-text">Sign Out</span>
                <ChevronRight size={20} className="action-chevron" />
              </button>
            </div>
          </MobileCard>
        </div>
      </MobileContainer>
    </>
  )
}
