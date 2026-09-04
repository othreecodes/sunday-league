'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  Trophy,
  Calendar,
  User,
  LogOut,
  Settings,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  ArrowUpRight,
  LogIn
} from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import { useSettings } from '@/hooks/useSettings'
import { BRAND_NAME } from '@/lib/brand'
import './page.css'

interface Group {
  id: string
  name: string
}

interface Match {
  id: string
  matchDate: string
  location: string | null
  status: string
  homeScore: number
  awayScore: number
  homeGroup: Group
  awayGroup: Group
  season: { name: string }
}

interface TableEntry {
  groupId: string
  groupName: string
  played: number
  goalDifference: number
  points: number
}

interface Season {
  id: string
  name: string
  isActive: boolean
}

export default function Home() {
  const { data: session } = useSession()
  const { leagueName } = useSettings()

  const [season, setSeason] = useState<Season | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [table, setTable] = useState<TableEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [seasonsRes, matchesRes] = await Promise.all([
        fetch('/api/seasons'),
        fetch('/api/matches')
      ])
      const seasons: Season[] = await seasonsRes.json()
      const allMatches: Match[] = await matchesRes.json()

      const active = seasons.find((s) => s.isActive) || seasons[0] || null
      setSeason(active)
      setMatches(Array.isArray(allMatches) ? allMatches : [])

      if (active) {
        const leagueRes = await fetch(`/api/league/${active.id}`)
        if (leagueRes.ok) {
          const data = await leagueRes.json()
          setTable(data.table || [])
        }
      }
    } catch {
      /* home degrades to the quick actions if the summary can't load */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const seasonMatches = season
    ? matches.filter((m) => m.season?.name === season.name)
    : matches

  const live = seasonMatches.find((m) => m.status === 'IN_PROGRESS')

  const upcoming = seasonMatches
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => +new Date(a.matchDate) - +new Date(b.matchDate))[0]

  const lastResult = seasonMatches
    .filter((m) => m.status === 'COMPLETED')
    .sort((a, b) => +new Date(b.matchDate) - +new Date(a.matchDate))[0]

  const feature = live || upcoming || lastResult

  const featureKind = feature
    ? feature.status === 'IN_PROGRESS'
      ? 'live'
      : feature.status === 'SCHEDULED'
        ? 'next'
        : 'result'
    : null

  const formatDay = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.round(
      (new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 86400000
    )
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const isAdmin = session?.user.role === 'ADMIN'

  return (
    <>
      <MobileHeader
        title={BRAND_NAME}
        eyebrow={season?.name}
        subtitle={leagueName && leagueName !== BRAND_NAME ? leagueName : undefined}
      />

      <MobileContainer>
        <div className="split-2">
          <div className="home-main">
            {/* ---------------------------------------------------------- */}
            {/* Featured match                                             */}
            {/* ---------------------------------------------------------- */}
            {loading ? (
              <div className="feature-skeleton" aria-hidden="true" />
            ) : feature ? (
              <Link href={`/matches/${feature.id}`} className="feature-match">
                <div className="feature-top">
                  <span className={`feature-kind kind-${featureKind}`}>
                    {featureKind === 'live' && (
                      <>
                        <span className="live-dot" />
                        Live now
                      </>
                    )}
                    {featureKind === 'next' && 'Next match'}
                    {featureKind === 'result' && 'Latest result'}
                  </span>
                  <ArrowUpRight size={18} className="feature-go" />
                </div>

                <div className="feature-teams">
                  <span className="feature-team">{feature.homeGroup.name}</span>
                  <span className="feature-score">
                    {featureKind === 'next' ? (
                      <span className="feature-vs">vs</span>
                    ) : (
                      <>
                        {feature.homeScore}
                        <span className="feature-dash">–</span>
                        {feature.awayScore}
                      </>
                    )}
                  </span>
                  <span className="feature-team feature-team-away">{feature.awayGroup.name}</span>
                </div>

                <div className="feature-meta">
                  <span>
                    <Calendar size={14} />
                    {formatDay(feature.matchDate)} · {formatTime(feature.matchDate)}
                  </span>
                  {feature.location && (
                    <span>
                      <MapPin size={14} />
                      {feature.location}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="feature-empty">
                <Calendar size={28} />
                <h3>No fixtures yet</h3>
                <p>Scheduled matches will show up here.</p>
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Quick actions                                              */}
            {/* ---------------------------------------------------------- */}
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">Quick actions</h2>
              </div>

              <div className="quick-actions">
                <Link href="/league" className="action-card">
                  <span className="action-icon icon-lime">
                    <Trophy size={20} />
                  </span>
                  <span className="action-content">
                    <span className="action-title">League table</span>
                    <span className="action-sub">Current standings</span>
                  </span>
                  <ChevronRight size={18} className="action-arrow" />
                </Link>

                <Link href="/matches" className="action-card">
                  <span className="action-icon icon-cyan">
                    <Calendar size={20} />
                  </span>
                  <span className="action-content">
                    <span className="action-title">Matches</span>
                    <span className="action-sub">Fixtures &amp; results</span>
                  </span>
                  <ChevronRight size={18} className="action-arrow" />
                </Link>

                {session ? (
                  isAdmin ? (
                    <>
                      <Link href="/admin/matches" className="action-card">
                        <span className="action-icon icon-amber">
                          <ClipboardCheck size={20} />
                        </span>
                        <span className="action-content">
                          <span className="action-title">Record a result</span>
                          <span className="action-sub">Update scores &amp; scorers</span>
                        </span>
                        <ChevronRight size={18} className="action-arrow" />
                      </Link>

                      <Link href="/admin" className="action-card">
                        <span className="action-icon icon-violet">
                          <Settings size={20} />
                        </span>
                        <span className="action-content">
                          <span className="action-title">Admin</span>
                          <span className="action-sub">Manage the league</span>
                        </span>
                        <ChevronRight size={18} className="action-arrow" />
                      </Link>
                    </>
                  ) : (
                    <Link href="/profile" className="action-card">
                      <span className="action-icon icon-violet">
                        <User size={20} />
                      </span>
                      <span className="action-content">
                        <span className="action-title">My profile</span>
                        <span className="action-sub">Your record this season</span>
                      </span>
                      <ChevronRight size={18} className="action-arrow" />
                    </Link>
                  )
                ) : (
                  <Link href="/auth/signin" className="action-card">
                    <span className="action-icon icon-violet">
                      <LogIn size={20} />
                    </span>
                    <span className="action-content">
                      <span className="action-title">Sign in</span>
                      <span className="action-sub">Access your account</span>
                    </span>
                    <ChevronRight size={18} className="action-arrow" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Side column: standings snapshot + account                    */}
          {/* ------------------------------------------------------------ */}
          <div className="home-side">
            <div className="mobile-section">
              <div className="mobile-section-header">
                <h2 className="mobile-section-title">Standings</h2>
                <Link href="/league" className="mobile-section-action">
                  Full table
                </Link>
              </div>

              {table.length > 0 ? (
                <MobileCard padding="none">
                  <ul className="mini-table">
                    {table.slice(0, 5).map((row, i) => (
                      <li key={row.groupId} className="mini-row">
                        <span className={`mini-pos ${i === 0 ? 'first' : ''}`}>{i + 1}</span>
                        <span className="mini-team">{row.groupName}</span>
                        <span className="mini-played">{row.played}</span>
                        <span
                          className={`mini-gd ${row.goalDifference >= 0 ? 'positive' : 'negative'}`}
                        >
                          {row.goalDifference >= 0 ? '+' : ''}
                          {row.goalDifference}
                        </span>
                        <span className="mini-pts">{row.points}</span>
                      </li>
                    ))}
                  </ul>
                </MobileCard>
              ) : (
                <MobileCard padding="medium">
                  <p className="mini-empty">
                    {loading ? 'Loading standings…' : 'No matches played yet this season.'}
                  </p>
                </MobileCard>
              )}
            </div>

            {session && (
              <div className="mobile-section">
                <div className="mobile-section-header">
                  <h2 className="mobile-section-title">Account</h2>
                </div>

                <MobileCard padding="medium">
                  <div className="account-card">
                    <div className="account-avatar">
                      {(session.user.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="account-details">
                      <span className="account-name">{session.user.name}</span>
                      {session.user.nickname && (
                        <span className="account-handle">@{session.user.nickname}</span>
                      )}
                    </div>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-signout">
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </MobileCard>
              </div>
            )}
          </div>
        </div>
      </MobileContainer>
    </>
  )
}
