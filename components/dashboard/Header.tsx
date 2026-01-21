'use client'

import { signOut } from '@/app/actions/auth'
import { FiLogOut, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useTranslation } from '@/components/providers/I18nProvider'
import { SUPPORTED_LOCALES } from '@/lib/constants/locales'
import Button from '@/components/ui/Button'
import { useSidebar } from './SidebarContext'
import { useMobileMenu } from './MobileMenuContext'

interface HeaderProps {
  user: any
  restaurant: any
}

export default function DashboardHeader({ user, restaurant }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useTranslation()
  const { isOpen, setIsOpen } = useMobileMenu()

  return (
    <header className="sticky top-0 z-[9998] flex h-14 sm:h-16 shrink-0 items-center gap-x-1 min-[400px]:gap-x-2 sm:gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 min-[400px]:px-2 sm:px-4 shadow-sm sm:gap-x-6 lg:px-8">
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
        ) : (
          <FiMenu className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      <div className="flex flex-1 gap-x-1 min-[400px]:gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center min-w-0">
          <h2 className="hidden sm:block text-sm min-[400px]:text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
            {restaurant.name}
          </h2>
        </div>
        <div className="flex items-center gap-x-1 min-[400px]:gap-x-1.5 sm:gap-x-4 lg:gap-x-6">
          {/* Language Switcher */}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as any)}
            className="hidden min-[400px]:block px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[45px] sm:min-w-[80px]"
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.flag} {loc.name}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hidden min-[350px]:block p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <FiMoon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <FiSun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-300/60 dark:border-gray-600/60">
              {user.user_metadata?.picture || user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.picture || user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {(user.user_metadata?.name || user.email || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] lg:max-w-none">
              {user.user_metadata.name || user.email}
            </span>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <FiLogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
