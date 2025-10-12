'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, Trophy, Calendar, User, Settings } from 'lucide-react'
import './MobileNav.css'

export default function MobileNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav className="mobile-nav">
      <Link
        href="/"
        className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
      >
        <Home size={24} />
        <span>Home</span>
      </Link>

      <Link
        href="/league"
        className={`mobile-nav-item ${isActive('/league') ? 'active' : ''}`}
      >
        <Trophy size={24} />
        <span>League</span>
      </Link>

      <Link
        href="/matches"
        className={`mobile-nav-item ${isActive('/matches') ? 'active' : ''}`}
      >
        <Calendar size={24} />
        <span>Matches</span>
      </Link>

      {status === 'authenticated' && session && (
        <>
          {session.user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`mobile-nav-item ${isActive('/admin') ? 'active' : ''}`}
            >
              <Settings size={24} />
              <span>Admin</span>
            </Link>
          )}

          <Link
            href="/profile"
            className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
          >
            <User size={24} />
            <span>Profile</span>
          </Link>
        </>
      )}
    </nav>
  )
}
