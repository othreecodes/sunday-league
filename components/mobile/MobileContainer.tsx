'use client'

import { ReactNode } from 'react'
import './MobileContainer.css'

interface MobileContainerProps {
  children: ReactNode
  padding?: boolean
  className?: string
}

export default function MobileContainer({
  children,
  padding = true,
  className = ''
}: MobileContainerProps) {
  return (
    <div className={`mobile-container ${padding ? 'padded' : ''} ${className}`}>
      {children}
    </div>
  )
}
