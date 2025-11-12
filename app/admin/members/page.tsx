'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Users, Shield, Mail, Calendar, Award, LayoutGrid, List } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import RefreshIndicator from '@/components/RefreshIndicator'
import { useCachedData } from '@/hooks/useCachedData'
import './members.css'

interface Member {
  id: string
  name: string
  email: string
  nickname: string | null
  role: string
  createdAt: string
  _count: {
    goalsScored: number
    cardsReceived: number
    groupMembers: number
  }
}

type ViewMode = 'list' | 'grid'

export default function MembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'admin' | 'referee' | 'member'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Fetch function for members
  const fetchMembersData = useCallback(async (): Promise<Member[]> => {
    const res = await fetch('/api/users')
    if (!res.ok) {
      throw new Error('Failed to fetch members')
    }
    return res.json()
  }, [])

  // Use cached data hook
  const { data: members, loading, refreshing, refetch } = useCachedData<Member[]>(
    fetchMembersData,
    {
      cacheKey: 'members',
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    }
  )

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    }
  }, [session, status, router])

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (res.ok) {
        refetch()
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
      <div className="mobile-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  const filteredMembers = (members || []).filter(member => {
    if (filter === 'all') return true
    return member.role === filter.toUpperCase()
  })

  const membersList = members || []

  return (
    <>
      <MobileHeader
        title="Members"
        subtitle="Manage all members"
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={20} />
          </button>
        }
        rightAction={<RefreshIndicator isRefreshing={refreshing} />}
      />

      <MobileContainer>
        {/* Filter Tabs */}
        <MobileCard padding="small" className="filter-card">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({membersList.length})
            </button>
            <button
              className={`filter-tab ${filter === 'admin' ? 'active' : ''}`}
              onClick={() => setFilter('admin')}
            >
              Admins ({membersList.filter(m => m.role === 'ADMIN').length})
            </button>
            <button
              className={`filter-tab ${filter === 'referee' ? 'active' : ''}`}
              onClick={() => setFilter('referee')}
            >
              Referees ({membersList.filter(m => m.role === 'REFEREE').length})
            </button>
            <button
              className={`filter-tab ${filter === 'member' ? 'active' : ''}`}
              onClick={() => setFilter('member')}
            >
              Members ({membersList.filter(m => m.role === 'MEMBER').length})
            </button>
          </div>
        </MobileCard>

        {/* Members Section */}
        <div className="mobile-section">
          <div className="mobile-section-header">
            <h2 className="mobile-section-title">
              {filter === 'all' ? 'All Members' : filter === 'admin' ? 'Admins' : filter === 'referee' ? 'Referees' : 'Members'}
            </h2>
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('list')}
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                aria-label="List view"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          {loading && !members ? (
            <div className="mobile-loading">
              <div className="spinner" />
              <p>Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="mobile-empty-state">
              <div className="mobile-empty-icon">
                <Users size={64} />
              </div>
              <h3 className="mobile-empty-title">No Members Found</h3>
              <p className="mobile-empty-description">No members match the current filter</p>
            </div>
          ) : viewMode === 'list' ? (
            <MobileCard padding="none" className="members-table-card">
              <div className="members-table-wrapper">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th className="col-name">Name</th>
                      <th className="col-role">Role</th>
                      <th className="col-stat">Goals</th>
                      <th className="col-stat">Cards</th>
                      <th className="col-stat">Teams</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="table-row">
                        <td className="col-name">
                          <div className="member-cell">
                            <div className="member-avatar-small">
                              <User size={20} />
                            </div>
                            <div className="member-cell-info">
                              <span className="member-name-table">{member.name}</span>
                              {member.nickname && (
                                <span className="member-email-table">@{member.nickname}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="col-role">
                          {session.user.id !== member.id ? (
                            <select
                              value={member.role}
                              onChange={(e) => updateRole(member.id, e.target.value)}
                              className={`role-badge-select ${member.role.toLowerCase()}`}
                            >
                              <option value="MEMBER">Member</option>
                              <option value="REFEREE">Referee</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${member.role.toLowerCase()}`}>
                              {member.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="col-stat">{member._count.goalsScored}</td>
                        <td className="col-stat">{member._count.cardsReceived}</td>
                        <td className="col-stat">{member._count.groupMembers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </MobileCard>
          ) : (
            <div className="mobile-card-list">
              {filteredMembers.map((member) => (
                <MobileCard key={member.id} padding="medium">
                  <div className="member-card">
                    <div className="member-header">
                      <div className="member-avatar">
                        <User size={32} />
                      </div>
                      <div className="member-info">
                        <h3>{member.name}</h3>
                        {member.nickname && (
                          <div className="member-email">
                            <User size={14} />
                            @{member.nickname}
                          </div>
                        )}
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
                          <option value="REFEREE">Referee</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    )}
                  </div>
                </MobileCard>
              ))}
            </div>
          )}
        </div>
      </MobileContainer>
    </>
  )
}
