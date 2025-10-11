'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, Home, Trophy, User, Calendar, Users, FileText, Target, BarChart3, Plus, ClipboardList } from 'lucide-react'
import './admin.css'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    }
  }, [session, status, router])

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1><Settings size={28} className="inline-icon" /> Admin Dashboard</h1>
        <nav className="header-nav">
          <Link href="/" className="nav-link"><Home size={18} /> Home</Link>
          <Link href="/league" className="nav-link"><Trophy size={18} /> League</Link>
          <Link href="/profile" className="nav-link"><User size={18} /> Profile</Link>
        </nav>
      </header>

      <main className="admin-main">
        <div className="welcome-section">
          <h2>Welcome, {session.user.name}</h2>
          <p>Manage your Sunday league from here</p>
        </div>

        <div className="admin-grid">
          <div className="admin-card">
            <div className="card-icon"><Calendar size={40} strokeWidth={1.5} /></div>
            <h3>Seasons</h3>
            <p>Create and manage seasons</p>
            <Link href="/admin/seasons" className="card-link">
              Manage Seasons →
            </Link>
          </div>

          <div className="admin-card">
            <div className="card-icon"><Users size={40} strokeWidth={1.5} /></div>
            <h3>Groups</h3>
            <p>Create and organize teams</p>
            <Link href="/admin/groups" className="card-link">
              Manage Groups →
            </Link>
          </div>

          <div className="admin-card">
            <div className="card-icon"><FileText size={40} strokeWidth={1.5} /></div>
            <h3>Matches</h3>
            <p>Schedule and record matches</p>
            <Link href="/admin/matches" className="card-link">
              Manage Matches →
            </Link>
          </div>

          <div className="admin-card">
            <div className="card-icon"><Target size={40} strokeWidth={1.5} /></div>
            <h3>Match Events</h3>
            <p>Record goals and cards</p>
            <Link href="/admin/matches" className="card-link">
              Manage Match Events →
            </Link>
          </div>

          <div className="admin-card">
            <div className="card-icon"><User size={40} strokeWidth={1.5} /></div>
            <h3>Members</h3>
            <p>View and manage members</p>
            <Link href="/admin/members" className="card-link">
              View Members →
            </Link>
          </div>

          <div className="admin-card">
            <div className="card-icon"><BarChart3 size={40} strokeWidth={1.5} /></div>
            <h3>Statistics</h3>
            <p>View detailed statistics</p>
            <Link href="/league" className="card-link">
              View League Stats →
            </Link>
          </div>

          <div className="admin-card">
            <div className="card-icon"><Settings size={40} strokeWidth={1.5} /></div>
            <h3>Settings</h3>
            <p>Configure league settings</p>
            <Link href="/admin/settings" className="card-link">
              Manage Settings →
            </Link>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link href="/admin/matches" className="action-btn">
              <ClipboardList size={24} />
              Manage Matches
            </Link>
            <Link href="/admin/seasons" className="action-btn">
              <Plus size={24} />
              Manage Seasons
            </Link>
            <Link href="/admin/groups" className="action-btn">
              <Users size={24} />
              Manage Groups
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
