'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings as SettingsIcon, Save } from 'lucide-react'
import './settings.css'

interface Settings {
  id: string
  matchesPerSeason: number
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    matchesPerSeason: 1
  })
  const [submitting, setSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    } else {
      fetchSettings()
    }
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setFormData({ matchesPerSeason: data.matchesPerSeason })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setSaveMessage('Settings saved successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSubmitting(false)
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
    <div className="settings-container">
      <header className="settings-header">
        <Link href="/admin" className="back-link">
          <ArrowLeft size={20} /> Back to Admin
        </Link>
        <h1><SettingsIcon size={28} className="inline-icon" /> Admin Settings</h1>
      </header>

      <main className="settings-main">
        {loading ? (
          <div className="loading">Loading settings...</div>
        ) : (
          <div className="settings-card">
            <h2>League Configuration</h2>
            <p className="settings-description">
              Configure how the league operates and generates fixtures.
            </p>

            <form onSubmit={handleSubmit} className="settings-form">
              <div className="setting-item">
                <div className="setting-label-group">
                  <label htmlFor="matchesPerSeason">Matches Per Season</label>
                  <p className="setting-description">
                    How many times each team plays every other team in a season.
                    <br />
                    <strong>1</strong> = Each team plays once (single round-robin)
                    <br />
                    <strong>2</strong> = Each team plays twice, home and away (double round-robin)
                  </p>
                </div>
                <div className="setting-input-group">
                  <input
                    type="number"
                    id="matchesPerSeason"
                    min="1"
                    max="10"
                    value={formData.matchesPerSeason}
                    onChange={(e) => setFormData({ ...formData, matchesPerSeason: parseInt(e.target.value) })}
                    required
                  />
                  <span className="input-hint">Between 1 and 10</span>
                </div>
              </div>

              <div className="form-actions">
                {saveMessage && (
                  <div className="save-message">{saveMessage}</div>
                )}
                <button type="submit" className="btn-submit" disabled={submitting}>
                  <Save size={20} />
                  {submitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
