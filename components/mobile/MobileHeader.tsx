'use client'

import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import './MobileHeader.css'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightAction?: ReactNode
  large?: boolean
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
  large = true
}: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header className={`mobile-header ${large ? 'large' : ''}`}>
      <div className="mobile-header-nav">
        {showBack && (
          <button onClick={() => router.back()} className="mobile-header-back">
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="mobile-header-spacer" />
        {rightAction && <div className="mobile-header-action">{rightAction}</div>}
      </div>
      <div className="mobile-header-content">
        <h1 className="mobile-header-title">{title}</h1>
        {subtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
      </div>
    </header>
  )
}
