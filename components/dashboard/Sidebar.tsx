'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiMenu, FiGrid, FiShoppingCart, FiSettings, FiStar, FiEye } from 'react-icons/fi'
import { MdRestaurantMenu, MdOutlineTableRestaurant } from 'react-icons/md'
import { IoRestaurantOutline } from 'react-icons/io5'
import { cn } from '@/lib/utils/cn'
import RouteProgressBar from './RouteProgressBar'

interface SidebarProps {
  restaurant: any
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Cardápio', href: '/dashboard/menu', icon: MdRestaurantMenu },
  { name: 'Mesas', href: '/dashboard/tables', icon: MdOutlineTableRestaurant },
  { name: 'Pedidos', href: '/dashboard/orders', icon: FiShoppingCart },
  { name: 'Cozinha', href: '/dashboard/kitchen', icon: IoRestaurantOutline },
  { name: 'Garçom', href: '/dashboard/waiter', icon: FiGrid },
  { name: 'Avaliações', href: '/dashboard/reviews', icon: FiStar },
  { name: 'Preview', href: '/dashboard/preview', icon: FiEye },
  { name: 'Configurações', href: '/dashboard/settings', icon: FiSettings },
]

export default function DashboardSidebar({ restaurant }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r-2 border-amber-500/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4 mb-6 gap-3">
              {restaurant.logo_url && (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="w-10 h-10 rounded-lg object-cover ring-2 ring-amber-500/20"
                />
              )}
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent truncate">
                {restaurant.name}
              </h1>
            </div>
            <nav className="flex-1 space-y-1.5 px-3">
              {navigation.map((item) => {
                const isDashboardRoot = item.href === '/dashboard'
                const isActive = isDashboardRoot
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-amber-50/80 dark:hover:bg-amber-500/10 hover:scale-[1.02] border border-transparent hover:border-amber-500/20'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                        isActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="border-t border-amber-500/20 px-3 py-3">
            <RouteProgressBar />
          </div>
        </div>
      </div>
    </>
  )
}
