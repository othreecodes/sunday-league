'use client'

import { ReactNode } from 'react'
import './FAB.css'

interface FABProps {
  onClick: () => void
  icon: ReactNode
  label?: string
  variant?: 'primary' | 'secondary'
}

export default function FAB({
  onClick,
  icon,
  label,
  variant = 'primary'
}: FABProps) {
  return (
    <button
      className={`fab fab-${variant} ${label ? 'fab-extended' : ''}`}
      onClick={onClick}
      aria-label={label || 'Action button'}
    >
      <span className="fab-icon">{icon}</span>
      {label && <span className="fab-label">{label}</span>}
    </button>
  )
}
