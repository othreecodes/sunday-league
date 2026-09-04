'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Home, Trophy, Calendar, User, Settings, LogIn, LogOut } from 'lucide-react'
import BrandMark from './BrandMark'
import { BRAND_NAME, BRAND_SUBLABEL } from '@/lib/brand'
import { useSettings } from '@/hooks/useSettings'
import './MobileNav.css'

export default function MobileNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { leagueName } = useSettings()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  const isAdmin = session?.user.role === 'ADMIN'
  const authed = status === 'authenticated' && !!session

  const items = [
    { href: '/', label: 'Home', icon: Home, show: true },
    { href: '/league', label: 'League', icon: Trophy, show: true },
    { href: '/matches', label: 'Matches', icon: Calendar, show: true },
    { href: '/admin', label: 'Admin', icon: Settings, show: authed && isAdmin },
    { href: '/profile', label: 'Profile', icon: User, show: authed }
  ].filter((i) => i.show)

  return (
    <nav className="app-nav" aria-label="Primary">
      {/* Desktop-only brand block */}
      <Link href="/" className="app-nav-brand">
        <BrandMark size={38} />
        <span className="app-nav-brand-text">
          <span className="app-nav-brand-name">{BRAND_NAME}</span>
          <span className="app-nav-brand-sub">
            {leagueName && leagueName !== BRAND_NAME ? leagueName : BRAND_SUBLABEL}
          </span>
        </span>
      </Link>

      <div className="app-nav-items">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`app-nav-item ${isActive(href) ? 'active' : ''}`}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <span className="app-nav-icon">
              <Icon size={22} strokeWidth={2} />
            </span>
            <span className="app-nav-label">{label}</span>
          </Link>
        ))}
      </div>

      {/* Desktop-only account footer */}
      <div className="app-nav-footer">
        {authed ? (
          <div className="app-nav-account">
            <div className="app-nav-avatar" aria-hidden="true">
              {(session.user.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="app-nav-account-text">
              <span className="app-nav-account-name">{session.user.name}</span>
              <span className="app-nav-account-role">
                {String(session.user.role || 'member').toLowerCase()}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="app-nav-signout"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        ) : (
          <Link href="/auth/signin" className="app-nav-signin">
            <LogIn size={17} />
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
