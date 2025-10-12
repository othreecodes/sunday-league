'use client'

import { ReactNode } from 'react'
import './MobileCard.css'

interface MobileCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
}

export default function MobileCard({
  children,
  onClick,
  className = '',
  padding = 'medium'
}: MobileCardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={`mobile-card ${className} padding-${padding} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {children}
    </Component>
  )
}
