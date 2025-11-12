'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Users, Plus, Trash2, User } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './group-detail.css'

interface GroupMember {
  id: string
  user: {
    id: string
    name: string
    email: string | null
    nickname: string | null
    isTemporary: boolean
  }
}

interface Group {
  id: string
  name: string
  season: {
    id: string
    name: string
  }
  members: GroupMember[]
  _count: {
    members: number
    homeMatches: number
    awayMatches: number
  }
}

interface AvailableUser {
  id: string
  name: string
  email: string
  nickname: string | null
}

export default function GroupDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const groupId = params?.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addType, setAddType] = useState<'existing' | 'temporary'>('existing')
  const [tempUserName, setTempUserName] = useState('')
  const [tempUserNickname, setTempUserNickname] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    } else {
      fetchData()
    }
  }, [session, status, router, groupId])

  const fetchData = async () => {
    try {
      const [groupRes, usersRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch('/api/users')
      ])

      if (groupRes.ok) {
        const groupData = await groupRes.json()
        setGroup(groupData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setAvailableUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (addType === 'existing' && !selectedUserId) return
    if (addType === 'temporary' && !tempUserName.trim()) return

    setSubmitting(true)

    try {
      if (addType === 'existing') {
        // Add existing user to group
        const res = await fetch(`/api/groups/${groupId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUserId })
        })

        if (res.ok) {
          setSelectedUserId('')
          setShowAddMember(false)
          fetchData()
        } else {
          alert('Failed to add member')
        }
      } else {
        // Create temporary user and add to group
        const res = await fetch('/api/users/temporary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tempUserName.trim(),
            nickname: tempUserNickname.trim() || undefined,
            groupId
          })
        })

        if (res.ok) {
          setTempUserName('')
          setTempUserNickname('')
          setShowAddMember(false)
          fetchData()
        } else {
          const error = await res.json()
          alert(error.error || 'Failed to create temporary member')
        }
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Error adding member')
    } finally {
      setSubmitting(false)
    }
  }

  const removeMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/members/${membershipId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Error removing member')
    }
  }

  const getNonMembers = () => {
    if (!group) return []
    const memberUserIds = group.members.map(m => m.user.id)
    return availableUsers.filter(user => !memberUserIds.includes(user.id))
  }

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
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
          title="Group Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={20} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading group details...</p>
          </div>
        </MobileContainer>
      </>
    )
  }

  if (!group) {
    return (
      <>
        <MobileHeader
          title="Group Details"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={20} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-empty-state">
            <h3 className="mobile-empty-title">Group not found</h3>
          </div>
        </MobileContainer>
      </>
    )
  }

  return (
    <>
      <MobileHeader
        title={group.name}
        subtitle={group.season.name}
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={20} />
          </button>
        }
      />

      <MobileContainer>
        <MobileCard padding="large" className="group-info-card">
          <h2>Group Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Season:</span>
              <span className="info-value">{group.season.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Members:</span>
              <span className="info-value">{group._count.members}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Matches:</span>
              <span className="info-value">
                {group._count.homeMatches + group._count.awayMatches}
              </span>
            </div>
          </div>
        </MobileCard>

        <div className="mobile-section">
          <div className="mobile-section-header">
            <h2 className="mobile-section-title">Team Members</h2>
            <button
              className="btn-primary"
              onClick={() => setShowAddMember(!showAddMember)}
              disabled={getNonMembers().length === 0}
            >
              <Plus size={20} />
              {showAddMember ? 'Cancel' : 'Add Member'}
            </button>
          </div>

          {showAddMember && (
            <MobileCard padding="large" className="add-member-form">
              <form onSubmit={addMember}>
                <div className="form-group">
                  <label>Member Type</label>
                  <div className="type-toggle">
                    <button
                      type="button"
                      className={`type-toggle-btn ${addType === 'existing' ? 'active' : ''}`}
                      onClick={() => setAddType('existing')}
                    >
                      Existing Member
                    </button>
                    <button
                      type="button"
                      className={`type-toggle-btn ${addType === 'temporary' ? 'active' : ''}`}
                      onClick={() => setAddType('temporary')}
                    >
                      Temporary Member
                    </button>
                  </div>
                </div>

                {addType === 'existing' ? (
                  <div className="form-group">
                    <label htmlFor="userId">Select Member</label>
                    <select
                      id="userId"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">Choose a member...</option>
                      {getNonMembers().map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}{user.nickname ? ` (@${user.nickname})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="tempName">Name *</label>
                      <input
                        type="text"
                        id="tempName"
                        value={tempUserName}
                        onChange={(e) => setTempUserName(e.target.value)}
                        placeholder="e.g., John Doe"
                        required
                      />
                      <small className="form-hint">
                        This person hasn't signed up yet
                      </small>
                    </div>
                    <div className="form-group">
                      <label htmlFor="tempNickname">Nickname (optional)</label>
                      <input
                        type="text"
                        id="tempNickname"
                        value={tempUserNickname}
                        onChange={(e) => setTempUserNickname(e.target.value)}
                        placeholder="e.g., Johnny"
                      />
                    </div>
                  </>
                )}

                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Adding...' : addType === 'existing' ? 'Add to Group' : 'Create & Add to Group'}
                </button>
              </form>
            </MobileCard>
          )}

          {group.members.length === 0 ? (
            <div className="mobile-empty-state">
              <div className="mobile-empty-icon">
                <Users size={64} />
              </div>
              <h3 className="mobile-empty-title">No Members Yet</h3>
              <p className="mobile-empty-description">Add members to get started</p>
            </div>
          ) : (
            <div className="mobile-card-list">
              {group.members.map((member) => (
                <MobileCard key={member.id} padding="medium">
                  <div className="member-card">
                    <div className="member-avatar">
                      <User size={32} />
                    </div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <h3>{member.user.name}</h3>
                        {member.user.isTemporary && (
                          <span className="temp-badge">Temporary</span>
                        )}
                      </div>
                      {member.user.nickname && (
                        <div className="member-email">
                          <User size={14} />
                          @{member.user.nickname}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => removeMember(member.id)}
                      title="Remove from group"
                    >
                      <Trash2 size={18} />
                    </button>
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
