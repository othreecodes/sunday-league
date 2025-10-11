'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Trash2, User, Mail } from 'lucide-react'
import './group-detail.css'

interface GroupMember {
  id: string
  user: {
    id: string
    name: string
    email: string
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
    if (!selectedUserId) return

    setSubmitting(true)

    try {
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
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading group details...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="loading-container">
        <div className="error-box">Group not found</div>
      </div>
    )
  }

  return (
    <div className="group-detail-container">
      <header className="group-detail-header">
        <Link href="/admin/groups" className="back-link">
          <ArrowLeft size={20} /> Back to Groups
        </Link>
        <h1><Users size={28} className="inline-icon" /> {group.name}</h1>
      </header>

      <main className="group-detail-main">
        <div className="group-info-card">
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
        </div>

        <div className="members-section">
          <div className="section-header">
            <h2>Team Members</h2>
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
            <div className="add-member-form">
              <form onSubmit={addMember}>
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
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add to Group'}
                </button>
              </form>
            </div>
          )}

          {group.members.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No Members Yet</h3>
              <p>Add members to get started</p>
            </div>
          ) : (
            <div className="members-grid">
              {group.members.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    <User size={32} />
                  </div>
                  <div className="member-info">
                    <h3>{member.user.name}</h3>
                    <div className="member-email">
                      <Mail size={14} />
                      {member.user.email}
                    </div>
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => removeMember(member.id)}
                    title="Remove from group"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
