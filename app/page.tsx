'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Trophy, Target, User, LogOut, Settings, ChevronRight, ClipboardCheck } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import { useSettings } from '@/hooks/useSettings'
import './page.css'

export default function Home() {
  const { data: session, status } = useSession()
  const { leagueName } = useSettings()

  return (
    <div className="home-mobile-container">
      <MobileHeader
        title={leagueName}
        subtitle="Sunday League Manager"
        showBackButton={false}
      />

      <MobileContainer>
        {/* Quick Actions */}
        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>

        <div className="quick-actions">
          <Link href="/league" className="action-card">
            <div className="action-icon primary">
              <Trophy size={28} />
            </div>
            <div className="action-content">
              <h4>League Table</h4>
              <p>View current standings</p>
            </div>
            <ChevronRight size={20} className="action-arrow" />
          </Link>

          <Link href="/matches" className="action-card">
            <div className="action-icon secondary">
              <Target size={28} />
            </div>
            <div className="action-content">
              <h4>Matches</h4>
              <p>View fixtures & results</p>
            </div>
            <ChevronRight size={20} className="action-arrow" />
          </Link>

          {session ? (
            session.user.role === 'ADMIN' ? (
              <>
                <Link href="/admin/matches" className="action-card">
                  <div className="action-icon record">
                    <ClipboardCheck size={28} />
                  </div>
                  <div className="action-content">
                    <h4>Record Match Result</h4>
                    <p>Update match scores</p>
                  </div>
                  <ChevronRight size={20} className="action-arrow" />
                </Link>

                <Link href="/admin" className="action-card">
                  <div className="action-icon admin">
                    <Settings size={28} />
                  </div>
                  <div className="action-content">
                    <h4>Admin Dashboard</h4>
                    <p>Manage your league</p>
                  </div>
                  <ChevronRight size={20} className="action-arrow" />
                </Link>
              </>
            ) : (
              <Link href="/profile" className="action-card">
                <div className="action-icon profile">
                  <User size={28} />
                </div>
                <div className="action-content">
                  <h4>My Profile</h4>
                  <p>View your stats</p>
                </div>
                <ChevronRight size={20} className="action-arrow" />
              </Link>
            )
          ) : (
            <Link href="/auth/signin" className="action-card">
              <div className="action-icon profile">
                <User size={28} />
              </div>
              <div className="action-content">
                <h4>Sign In</h4>
                <p>Access your account</p>
              </div>
              <ChevronRight size={20} className="action-arrow" />
            </Link>
          )}
        </div>

        {/* Account Section */}
        {session && (
          <div className="account-section">
            <div className="section-header">
              <h3>Account</h3>
            </div>

            <MobileCard padding="none">
              <div className="account-card">
                <div className="account-info">
                  <div className="account-avatar">
                    <User size={24} />
                  </div>
                  <div className="account-details">
                    <span className="account-name">{session.user.name}</span>
                    {session.user.nickname && (
                      <span className="account-email">@{session.user.nickname}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => signOut()} className="btn-signout-mobile">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </MobileCard>
          </div>
        )}
      </MobileContainer>
    </div>
  )
}
