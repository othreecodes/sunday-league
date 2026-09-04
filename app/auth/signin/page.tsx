'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandMark from '@/components/BrandMark'
import { BRAND_NAME } from '@/lib/brand'
import './signin.css'

export default function SignIn() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        nickname,
        password
      })

      if (result?.error) {
        setError('Invalid username or password')
      } else {
        router.push('/league')
        router.refresh()
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          {/* Static brand: the old version rendered a DB value, which flashed
              a different name on every load. */}
          <BrandMark size={52} />
          <h1>{BRAND_NAME}</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nickname">Username</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="link">
              Register
            </Link>
          </p>
          <Link href="/" className="link link-muted">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
