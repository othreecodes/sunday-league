'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, Trash2, Edit2, Grid3x3, List } from 'lucide-react'
import './groups.css'

interface Season {
  id: string
  name: string
  isActive: boolean
}

interface Group {
  id: string
  name: string
  seasonId: string
  season: {
    name: string
  }
  _count: {
    members: number
    homeMatches: number
    awayMatches: number
  }
}

export default function GroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    seasonId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [filterSeasonId, setFilterSeasonId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    } else {
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [seasonsRes, groupsRes] = await Promise.all([
        fetch('/api/seasons'),
        fetch('/api/groups')
      ])

      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json()
        setSeasons(seasonsData)

        // Set default season to active one
        const activeSeason = seasonsData.find((s: Season) => s.isActive)
        if (activeSeason) {
          // Set form default
          if (!formData.seasonId) {
            setFormData(prev => ({ ...prev, seasonId: activeSeason.id }))
          }
          // Set filter default to active season
          if (filterSeasonId === 'all') {
            setFilterSeasonId(activeSeason.id)
          }
        }
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups(groupsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setFormData({ name: '', seasonId: formData.seasonId })
        setShowForm(false)
        fetchData()
      } else {
        alert('Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Error creating group')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will delete all associated data.')) {
      return
    }

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete group')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Error deleting group')
    }
  }

  const filteredGroups = filterSeasonId === 'all'
    ? groups
    : groups.filter(g => g.seasonId === filterSeasonId)

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="groups-container">
      <header className="groups-header">
        <Link href="/admin" className="back-link">
          <ArrowLeft size={20} /> Back to Admin
        </Link>
        <h1><Users size={28} className="inline-icon" /> Groups Management</h1>
      </header>

      <main className="groups-main">
        <div className="groups-actions">
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={seasons.length === 0}
          >
            <Plus size={20} /> {showForm ? 'Cancel' : 'Create New Group'}
          </button>
          {seasons.length === 0 && (
            <p className="warning-text">Please create a season first</p>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="seasonFilter">Filter by Season:</label>
            <select
              id="seasonFilter"
              value={filterSeasonId}
              onChange={(e) => setFilterSeasonId(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Seasons</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="view-switcher">
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <Grid3x3 size={20} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {showForm && (
          <div className="group-form-card">
            <h2>Create New Group</h2>
            <form onSubmit={handleSubmit} className="group-form">
              <div className="form-group">
                <label htmlFor="seasonId">Season</label>
                <select
                  id="seasonId"
                  value={formData.seasonId}
                  onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                  required
                >
                  <option value="">Select a season</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} {season.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="name">Group Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Team A, Engineering FC"
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        )}

        <div className="groups-list">
          {loading ? (
            <div className="loading">Loading groups...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>{groups.length === 0 ? 'No Groups Yet' : 'No Groups Found'}</h3>
              <p>{groups.length === 0 ? 'Create your first group to get started' : 'No groups found for the selected filter'}</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="groups-grid">
              {filteredGroups.map((group) => (
                <div key={group.id} className="group-card">
                  <div className="group-header">
                    <h3>{group.name}</h3>
                    <span className="season-badge">{group.season.name}</span>
                  </div>

                  <div className="group-stats">
                    <div className="stat-item">
                      <span className="stat-value">{group._count.members}</span>
                      <span className="stat-label">Members</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {group._count.homeMatches + group._count.awayMatches}
                      </span>
                      <span className="stat-label">Matches</span>
                    </div>
                  </div>

                  <div className="group-actions">
                    <Link href={`/admin/groups/${group.id}`} className="btn-icon btn-edit">
                      <Edit2 size={18} />
                      Manage
                    </Link>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => deleteGroup(group.id)}
                      title="Delete group"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="groups-table">
              <table>
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Season</th>
                    <th>Members</th>
                    <th>Matches</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr key={group.id}>
                      <td className="group-name-cell">{group.name}</td>
                      <td><span className="season-badge">{group.season.name}</span></td>
                      <td>{group._count.members}</td>
                      <td>{group._count.homeMatches + group._count.awayMatches}</td>
                      <td className="actions-cell">
                        <Link href={`/admin/groups/${group.id}`} className="btn-icon btn-edit">
                          <Edit2 size={16} />
                        </Link>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => deleteGroup(group.id)}
                          title="Delete group"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
