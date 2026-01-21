'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiGrid, FiSettings, FiStar, FiEye, FiMenu } from 'react-icons/fi'
import { MdRestaurantMenu, MdOutlineTableRestaurant } from 'react-icons/md'
import { IoRestaurantOutline } from 'react-icons/io5'
import { cn } from '@/lib/utils/cn'
import RouteProgressBar from './RouteProgressBar'
import { useSidebar } from './SidebarContext'
import { useMobileMenu } from './MobileMenuContext'
import { useEffect } from 'react'
import { useTranslation } from '@/components/providers/I18nProvider'

interface SidebarProps {
  restaurant: any
}

const navigation = [
  { key: 'dashboard.title', href: '/dashboard', icon: FiHome },
  { key: 'dashboard.menu', href: '/dashboard/menu', icon: MdRestaurantMenu },
  { key: 'dashboard.tables', href: '/dashboard/tables', icon: MdOutlineTableRestaurant },
  { key: 'dashboard.kitchen', href: '/dashboard/kitchen', icon: IoRestaurantOutline },
  { key: 'dashboard.waiter', href: '/dashboard/waiter', icon: FiGrid },
  { key: 'dashboardReviews.title', href: '/dashboard/reviews', icon: FiStar },
  { key: 'dashboardPreview.title', href: '/dashboard/preview', icon: FiEye },
  { key: 'dashboard.settings', href: '/dashboard/settings', icon: FiSettings },
]

export default function DashboardSidebar({ restaurant }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { isOpen, setIsOpen } = useMobileMenu()
  const { t, locale } = useTranslation()

  // Ensure mobile always sees expanded labels even if desktop was collapsed before
  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncCollapse = () => {
      if (window.innerWidth < 1024 && isCollapsed) {
        setIsCollapsed(false)
      }
    }

    syncCollapse()
    window.addEventListener('resize', syncCollapse)
    return () => window.removeEventListener('resize', syncCollapse)
  }, [isCollapsed, setIsCollapsed])

  const NavItems = () => (
    <nav className="flex-1 space-y-1.5 px-3">
      {navigation.map((item) => {
        const isDashboardRoot = item.href === '/dashboard'
        const isActive = isDashboardRoot
          ? pathname === '/dashboard'
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-stone-300 dark:text-stone-300 hover:bg-amber-500/20 dark:hover:bg-amber-500/20 hover:text-white hover:scale-[1.02] border border-transparent hover:border-amber-500/40'
            )}
          >
            <item.icon
              className={cn(
                'flex-shrink-0 transition-transform group-hover:scale-110',
                isCollapsed ? 'mr-0 h-5 w-5' : 'mr-3 h-5 w-5',
                isActive ? 'text-white' : 'text-amber-400'
              )}
            />
            {!isCollapsed && <span suppressHydrationWarning>{t(item.key)}</span>}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-[40] lg:hidden pt-16">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-16 bottom-0 w-64 bg-slate-900 border-r border-amber-500/30 shadow-2xl overflow-y-auto">
            <div className="flex flex-col h-full pb-4">
              <NavItems />
              <div className="border-t border-amber-500/20 px-3 py-3 mt-auto">
                <RouteProgressBar />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300',
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      )}>
        <div className="flex min-h-0 flex-1 flex-col border-r-2 border-amber-500/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                {restaurant.logo_url && (
                  <img 
                    src={restaurant.logo_url} 
                    alt={restaurant.name}
                    className="w-10 h-10 rounded-lg object-cover ring-2 ring-amber-500/20"
                  />
                )}
                <h1 className="text-lg font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent truncate">
                  {restaurant.name}
                </h1>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-amber-50/80 dark:hover:bg-amber-500/10 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar collapse"
            >
              <FiMenu className={cn(
                'w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform',
                isCollapsed && 'rotate-180'
              )} />
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pb-4">
            <NavItems />
          </div>
          <div className="border-t border-amber-500/20 px-3 py-3">
            <RouteProgressBar />
          </div>
        </div>
      </div>
    </>
  )
}
