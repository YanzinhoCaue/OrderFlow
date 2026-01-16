'use client'

import { FiSun, FiMoon } from 'react-icons/fi'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  )
}
