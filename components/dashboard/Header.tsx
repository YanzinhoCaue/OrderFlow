'use client'

import { signOut } from '@/app/actions/auth'
import { FiLogOut, FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useTranslation } from '@/components/providers/I18nProvider'
import { SUPPORTED_LOCALES } from '@/lib/constants/locales'
import Button from '@/components/ui/Button'

interface HeaderProps {
  user: any
  restaurant: any
}

export default function DashboardHeader({ user, restaurant }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { locale, setLocale } = useTranslation()

  return (
    <header className="sticky top-0 z-[9998] flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {restaurant.name}
          </h2>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Language Switcher */}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-300/60 dark:border-gray-600/60">
              {user.user_metadata?.picture || user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.picture || user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {(user.user_metadata?.name || user.email || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.user_metadata.name || user.email}
            </span>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <FiLogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
