'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, FileText, User, BarChart3, Settings as SettingsIcon, UserPlus } from 'lucide-react'
import MobileHeader from '@/components/mobile/MobileHeader'
import MobileContainer from '@/components/mobile/MobileContainer'
import MobileCard from '@/components/mobile/MobileCard'
import './admin.css'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
    } else if (session.user.role !== 'ADMIN') {
      router.push('/league')
    }
  }, [session, status, router])

  if (status === 'loading' || !session || session.user.role !== 'ADMIN') {
    return (
      <div className="mobile-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  const adminSections = [
    {
      title: 'Seasons',
      description: 'Create and manage seasons',
      icon: Calendar,
      href: '/admin/seasons',
      color: '#3b82f6'
    },
    {
      title: 'Groups',
      description: 'Create and organize teams',
      icon: Users,
      href: '/admin/groups',
      color: '#8b5cf6'
    },
    {
      title: 'Matches',
      description: 'Schedule and record matches',
      icon: FileText,
      href: '/admin/matches',
      color: '#e90052'
    },
    {
      title: 'Members',
      description: 'View and manage members',
      icon: User,
      href: '/admin/members',
      color: '#10b981'
    },
    {
      title: 'Temporary Members',
      description: 'Link temporary accounts to real users',
      icon: UserPlus,
      href: '/admin/temporary-members',
      color: '#f97316'
    },
    {
      title: 'Statistics',
      description: 'View detailed statistics',
      icon: BarChart3,
      href: '/league',
      color: '#f59e0b'
    },
    {
      title: 'Settings',
      description: 'Configure league settings',
      icon: SettingsIcon,
      href: '/admin/settings',
      color: '#6b7280'
    }
  ]

  return (
    <>
      <MobileHeader
        title="Admin"
        subtitle="League Management"
      />

      <MobileContainer>
        {/* Admin Sections */}
        <div className="mobile-section">
          <div className="mobile-section-header">
            <h2 className="mobile-section-title">Management</h2>
          </div>

          <div className="mobile-card-list">
            {adminSections.map((section) => (
              <MobileCard
                key={section.title}
                padding="medium"
                onClick={() => router.push(section.href)}
              >
                <div className="admin-section-card">
                  <div
                    className="admin-section-icon"
                    style={{ backgroundColor: `${section.color}15`, color: section.color }}
                  >
                    <section.icon size={28} />
                  </div>
                  <div className="admin-section-content">
                    <h3 className="admin-section-title">{section.title}</h3>
                    <p className="admin-section-description">{section.description}</p>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>
      </MobileContainer>
    </>
  )
}
