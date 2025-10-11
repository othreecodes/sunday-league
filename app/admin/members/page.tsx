'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Users, Shield, Mail, Calendar, Award } from 'lucide-react'
import './members.css'

interface Member {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    goalsScored: number
    cardsReceived: number
    groupMembers: number
  }
}

export default function MembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'admin' | 'member'>('all')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    } else {
      fetchMembers()
    }
  }, [session, status, router])

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (res.ok) {
        fetchMembers()
      } else {
        alert('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error updating role')
    }
  }

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  const filteredMembers = members.filter(member => {
    if (filter === 'all') return true
    return member.role === filter.toUpperCase()
  })

  return (
    <div className="members-container">
      <header className="members-header">
        <Link href="/admin" className="back-link">
          <ArrowLeft size={20} /> Back to Admin
        </Link>
        <h1><Users size={28} className="inline-icon" /> Members Management</h1>
      </header>

      <main className="members-main">
        <div className="members-controls">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Members ({members.length})
            </button>
            <button
              className={`filter-tab ${filter === 'admin' ? 'active' : ''}`}
              onClick={() => setFilter('admin')}
            >
              Admins ({members.filter(m => m.role === 'ADMIN').length})
            </button>
            <button
              className={`filter-tab ${filter === 'member' ? 'active' : ''}`}
              onClick={() => setFilter('member')}
            >
              Members ({members.filter(m => m.role === 'MEMBER').length})
            </button>
          </div>
        </div>

        <div className="members-list">
          {loading ? (
            <div className="loading">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No Members Found</h3>
              <p>No members match the current filter</p>
            </div>
          ) : (
            <div className="members-grid">
              {filteredMembers.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="member-header">
                    <div className="member-avatar">
                      <User size={32} />
                    </div>
                    <div className="member-info">
                      <h3>{member.name}</h3>
                      <div className="member-email">
                        <Mail size={14} />
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div className="member-role">
                    <div className={`role-badge ${member.role.toLowerCase()}`}>
                      {member.role === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
                      {member.role}
                    </div>
                  </div>

                  <div className="member-stats">
                    <div className="stat-item">
                      <Award size={16} />
                      <span className="stat-value">{member._count.goalsScored}</span>
                      <span className="stat-label">Goals</span>
                    </div>
                    <div className="stat-item">
                      <div className="card-icon yellow"></div>
                      <span className="stat-value">{member._count.cardsReceived}</span>
                      <span className="stat-label">Cards</span>
                    </div>
                    <div className="stat-item">
                      <Users size={16} />
                      <span className="stat-value">{member._count.groupMembers}</span>
                      <span className="stat-label">Teams</span>
                    </div>
                  </div>

                  <div className="member-meta">
                    <Calendar size={14} />
                    <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                  </div>

                  {session.user.id !== member.id && (
                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={(e) => updateRole(member.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
