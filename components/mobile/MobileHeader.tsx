'use client'

import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import './MobileHeader.css'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  /** Legacy alias kept so existing pages keep compiling. */
  showBackButton?: boolean
  /** Some pages pass their own back control here. */
  leftAction?: ReactNode
  rightAction?: ReactNode
  large?: boolean
  /** Small tracked label above the title, e.g. the season. */
  eyebrow?: string
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  showBackButton,
  leftAction,
  rightAction,
  large = true,
  eyebrow
}: MobileHeaderProps) {
  const router = useRouter()
  const wantsBack = showBack || showBackButton === true

  const hasBar = wantsBack || !!leftAction || !!rightAction

  return (
    <header className={`page-header ${large ? 'large' : 'compact'}`}>
      <div className="page-header-inner">
        {hasBar && (
          <div className="page-header-bar">
            {leftAction
              ? <div className="page-header-left">{leftAction}</div>
              : wantsBack && (
                  <button
                    onClick={() => router.back()}
                    className="page-header-back"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                  </button>
                )}
            <div className="page-header-spacer" />
            {rightAction && <div className="page-header-action">{rightAction}</div>}
          </div>
        )}

        <div className="page-header-content">
          <div className="page-header-titles">
            {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
          </div>
          {/* On desktop the action sits beside the title rather than above it */}
          {rightAction && <div className="page-header-action-inline">{rightAction}</div>}
        </div>
      </div>
    </header>
  )
}
