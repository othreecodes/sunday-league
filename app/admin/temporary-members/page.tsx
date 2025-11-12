'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Users, Target, AlertCircle, Link2 } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './temporary-members.css'

interface TempUser {
  id: string
  name: string
  nickname: string | null
  createdAt: string
  _count: {
    goalsScored: number
    assists: number
    cardsReceived: number
    groupMembers: number
    matchPlayers: number
  }
  groupMembers: Array<{
    group: {
      id: string
      name: string
      season: {
        id: string
        name: string
      }
    }
  }>
}

interface RealUser {
  id: string
  name: string
  email: string | null
  nickname: string | null
}

export default function TemporaryMembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tempUsers, setTempUsers] = useState<TempUser[]>([])
  const [realUsers, setRealUsers] = useState<RealUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedTempUser, setSelectedTempUser] = useState<TempUser | null>(null)
  const [selectedRealUserId, setSelectedRealUserId] = useState('')
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE') {
      router.push('/league')
    } else {
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [tempRes, usersRes] = await Promise.all([
        fetch('/api/users/temporary'),
        fetch('/api/users')
      ])

      if (tempRes.ok) {
        const data = await tempRes.json()
        setTempUsers(data)
      }

      if (usersRes.ok) {
        const users = await usersRes.json()
        // Filter out temporary users from the real users list
        setRealUsers(users.filter((u: RealUser & { isTemporary: boolean }) => !u.isTemporary))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openMergeModal = (tempUser: TempUser) => {
    setSelectedTempUser(tempUser)
    setSelectedRealUserId('')
    setShowMergeModal(true)
  }

  const closeMergeModal = () => {
    setShowMergeModal(false)
    setSelectedTempUser(null)
    setSelectedRealUserId('')
  }

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTempUser || !selectedRealUserId) return

    if (!confirm(`Are you sure you want to merge "${selectedTempUser.name}" with the selected user? All stats, goals, and group memberships will be transferred.`)) {
      return
    }

    setMerging(true)

    try {
      const res = await fetch('/api/users/temporary/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempUserId: selectedTempUser.id,
          realUserId: selectedRealUserId
        })
      })

      if (res.ok) {
        const result = await res.json()
        alert(result.message || 'Users merged successfully!')
        closeMergeModal()
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to merge users')
      }
    } catch (error) {
      console.error('Error merging users:', error)
      alert('Error merging users')
    } finally {
      setMerging(false)
    }
  }

  if (status === 'loading' || !session || (session.user.role !== 'ADMIN' && session.user.role !== 'REFEREE')) {
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
          title="Temporary Members"
          leftAction={
            <button onClick={() => router.back()} className="back-btn">
              <ChevronLeft size={20} />
            </button>
          }
        />
        <MobileContainer>
          <div className="mobile-loading">
            <div className="spinner" />
            <p>Loading temporary members...</p>
          </div>
        </MobileContainer>
      </>
    )
  }

  return (
    <>
      <MobileHeader
        title="Temporary Members"
        subtitle={`${tempUsers.length} temporary ${tempUsers.length === 1 ? 'member' : 'members'}`}
        leftAction={
          <button onClick={() => router.back()} className="back-btn">
            <ChevronLeft size={20} />
          </button>
        }
      />

      <MobileContainer>
        {tempUsers.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="mobile-empty-icon">
              <Users size={64} />
            </div>
            <h3 className="mobile-empty-title">No Temporary Members</h3>
            <p className="mobile-empty-description">
              Temporary members are created when adding players who haven't signed up yet.
            </p>
          </div>
        ) : (
          <div className="mobile-card-list">
            {tempUsers.map((tempUser) => (
              <MobileCard key={tempUser.id} padding="large">
                <div className="temp-user-card">
                  <div className="temp-user-header">
                    <div className="temp-user-avatar">
                      <User size={32} />
                    </div>
                    <div className="temp-user-info">
                      <h3>{tempUser.name}</h3>
                      {tempUser.nickname && (
                        <div className="temp-user-nickname">@{tempUser.nickname}</div>
                      )}
                    </div>
                  </div>

                  <div className="temp-user-stats">
                    <div className="stat-item">
                      <Target size={16} />
                      <span className="stat-value">{tempUser._count.goalsScored}</span>
                      <span className="stat-label">Goals</span>
                    </div>
                    <div className="stat-item">
                      <Users size={16} />
                      <span className="stat-value">{tempUser._count.assists}</span>
                      <span className="stat-label">Assists</span>
                    </div>
                    <div className="stat-item">
                      <AlertCircle size={16} />
                      <span className="stat-value">{tempUser._count.cardsReceived}</span>
                      <span className="stat-label">Cards</span>
                    </div>
                  </div>

                  {tempUser.groupMembers.length > 0 && (
                    <div className="temp-user-groups">
                      <div className="groups-label">Groups:</div>
                      <div className="groups-list">
                        {tempUser.groupMembers.map((gm) => (
                          <span key={gm.group.id} className="group-tag">
                            {gm.group.name} ({gm.group.season.name})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    className="btn-merge"
                    onClick={() => openMergeModal(tempUser)}
                  >
                    <Link2 size={18} />
                    Link to Real Account
                  </button>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </MobileContainer>

      {/* Merge Modal */}
      {showMergeModal && selectedTempUser && (
        <div className="modal-overlay" onClick={closeMergeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Link Temporary Member</h2>
            <p className="modal-description">
              Link <strong>{selectedTempUser.name}</strong> to a real user account.
              All stats and group memberships will be transferred.
            </p>

            <form onSubmit={handleMerge}>
              <div className="form-group">
                <label htmlFor="realUser">Select Real User Account</label>
                <select
                  id="realUser"
                  value={selectedRealUserId}
                  onChange={(e) => setSelectedRealUserId(e.target.value)}
                  required
                >
                  <option value="">Choose a user...</option>
                  {realUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}{user.nickname ? ` (@${user.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeMergeModal}
                  disabled={merging}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={merging || !selectedRealUserId}
                >
                  {merging ? 'Merging...' : 'Link Accounts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
