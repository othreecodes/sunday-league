'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Trophy, Target, Users, Calendar, TrendingUp, Shield, User, LogOut, Settings } from 'lucide-react'
import './page.css'

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <Trophy size={40} strokeWidth={2} />
            <div className="logo-text">
              <h1>Cowrywise FC</h1>
              <p>Sunday League Manager</p>
            </div>
          </div>
          <div className="header-actions">
            <Link href="/league" className="header-link">
              League
            </Link>
            {status === 'loading' ? (
              <div className="header-loading">Loading...</div>
            ) : session ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" className="header-link">
                    <Settings size={18} />
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="header-link">
                  Profile
                </Link>
                <div className="user-info">
                  <User size={18} />
                  <span>{session.user.name}</span>
                </div>
                <button onClick={() => signOut()} className="btn-signout">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth/signin" className="btn-signin">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="hero">
          <h2>
            {session ? `Welcome back, ${session.user.name}!` : 'Welcome to Cowrywise FC'}
          </h2>
          <p className="hero-description">
            {session
              ? 'Your complete Sunday league football management system. Track matches, record results, and view live standings.'
              : 'Your complete Sunday league football management system. Track matches, record results, and view live standings.'}
          </p>

          <div className="cta-buttons">
            <Link href="/league" className="btn btn-primary">
              <Trophy size={20} />
              View League Table
            </Link>
            {session ? (
              session.user.role === 'ADMIN' ? (
                <Link href="/admin" className="btn btn-secondary">
                  <Settings size={20} />
                  Admin Dashboard
                </Link>
              ) : (
                <Link href="/profile" className="btn btn-secondary">
                  <User size={20} />
                  My Profile
                </Link>
              )
            ) : (
              <Link href="/auth/register" className="btn btn-secondary">
                Get Started
              </Link>
            )}
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <Trophy size={32} />
            </div>
            <h3>League Table</h3>
            <p>Track team standings with automatic point calculations and live updates</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Target size={32} />
            </div>
            <h3>Match Management</h3>
            <p>Schedule matches and record goals, assists, and cards in real-time</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={32} />
            </div>
            <h3>Player Stats</h3>
            <p>View top scorers, assists, and comprehensive player statistics</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3>Team Management</h3>
            <p>Organize teams and manage group memberships with ease</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Calendar size={32} />
            </div>
            <h3>Season Tracking</h3>
            <p>Manage multiple seasons and track historical performance</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={32} />
            </div>
            <h3>Admin Controls</h3>
            <p>Powerful admin dashboard for complete league management</p>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Trophy size={24} />
            <span>Cowrywise FC</span>
          </div>
          <p>&copy; 2025 Cowrywise FC Sunday League Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
