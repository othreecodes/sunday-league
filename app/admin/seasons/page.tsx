'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Trash2, CheckCircle, XCircle, Shuffle } from 'lucide-react'
import './seasons.css'

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isActive: boolean
  _count: {
    groups: number
    matches: number
  }
}

export default function SeasonsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    } else {
      fetchSeasons()
    }
  }, [session, status, router])

  const fetchSeasons = async () => {
    try {
      const res = await fetch('/api/seasons')
      if (res.ok) {
        const data = await res.json()
        setSeasons(data)
      }
    } catch (error) {
      console.error('Error fetching seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
        })
      })

      if (res.ok) {
        setFormData({ name: '', startDate: '', endDate: '' })
        setShowForm(false)
        fetchSeasons()
      } else {
        alert('Failed to create season')
      }
    } catch (error) {
      console.error('Error creating season:', error)
      alert('Error creating season')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (seasonId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        fetchSeasons()
      }
    } catch (error) {
      console.error('Error updating season:', error)
    }
  }

  const deleteSeason = async (seasonId: string) => {
    if (!confirm('Are you sure you want to delete this season? This will delete all associated data.')) {
      return
    }

    try {
      const res = await fetch(`/api/seasons/${seasonId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchSeasons()
      } else {
        alert('Failed to delete season')
      }
    } catch (error) {
      console.error('Error deleting season:', error)
      alert('Error deleting season')
    }
  }

  const generateFixtures = async (seasonId: string, groupCount: number) => {
    if (groupCount < 2) {
      alert('Need at least 2 teams to generate fixtures')
      return
    }

    if (!confirm(`Generate league fixtures for this season? This will create ${(groupCount * (groupCount - 1)) / 2} matches where each team plays every other team once.`)) {
      return
    }

    try {
      const res = await fetch(`/api/seasons/${seasonId}/generate-fixtures`, {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Success! Generated ${data.fixturesCreated} matches for ${data.teams} teams.`)
        fetchSeasons()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to generate fixtures')
      }
    } catch (error) {
      console.error('Error generating fixtures:', error)
      alert('Error generating fixtures')
    }
  }

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="seasons-container">
      <header className="seasons-header">
        <Link href="/admin" className="back-link">
          <ArrowLeft size={20} /> Back to Admin
        </Link>
        <h1><Calendar size={28} className="inline-icon" /> Seasons Management</h1>
      </header>

      <main className="seasons-main">
        <div className="seasons-actions">
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={20} /> {showForm ? 'Cancel' : 'Create New Season'}
          </button>
        </div>

        {showForm && (
          <div className="season-form-card">
            <h2>Create New Season</h2>
            <form onSubmit={handleSubmit} className="season-form">
              <div className="form-group">
                <label htmlFor="name">Season Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2025 Season"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date (Optional)</label>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Season'}
              </button>
            </form>
          </div>
        )}

        <div className="seasons-list">
          {loading ? (
            <div className="loading">Loading seasons...</div>
          ) : seasons.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No Seasons Yet</h3>
              <p>Create your first season to get started</p>
            </div>
          ) : (
            <div className="seasons-grid">
              {seasons.map((season) => (
                <div key={season.id} className={`season-card ${season.isActive ? 'active' : ''}`}>
                  <div className="season-header">
                    <h3>{season.name}</h3>
                    {season.isActive && <span className="active-badge">Active</span>}
                  </div>

                  <div className="season-dates">
                    <div className="date-item">
                      <span className="date-label">Start:</span>
                      <span>{new Date(season.startDate).toLocaleDateString()}</span>
                    </div>
                    {season.endDate && (
                      <div className="date-item">
                        <span className="date-label">End:</span>
                        <span>{new Date(season.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="season-stats">
                    <div className="stat-item">
                      <span className="stat-value">{season._count.groups}</span>
                      <span className="stat-label">Groups</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{season._count.matches}</span>
                      <span className="stat-label">Matches</span>
                    </div>
                  </div>

                  <div className="season-actions">
                    <button
                      className="btn-icon btn-fixtures"
                      onClick={() => generateFixtures(season.id, season._count.groups)}
                      title="Generate league fixtures"
                      disabled={season._count.groups < 2}
                    >
                      <Shuffle size={18} />
                      Generate Fixtures
                    </button>
                    <button
                      className={`btn-icon ${season.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => toggleActive(season.id, season.isActive)}
                      title={season.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {season.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      {season.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => deleteSeason(season.id)}
                      title="Delete season"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
