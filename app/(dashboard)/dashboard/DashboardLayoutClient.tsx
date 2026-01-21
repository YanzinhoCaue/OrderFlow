'use client'

import { ReactNode } from 'react'
import { useSidebar } from '@/components/dashboard/SidebarContext'
import { cn } from '@/lib/utils/cn'

interface DashboardLayoutClientProps {
  children: ReactNode
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div
      className={cn(
        'transition-all duration-300',
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      )}
    >
      {children}
    </div>
  )
}
