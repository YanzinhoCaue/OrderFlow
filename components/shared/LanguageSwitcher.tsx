'use client'

import { SUPPORTED_LOCALES } from '@/lib/constants/locales'
import { useTranslation } from '@/components/providers/I18nProvider'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
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
  )
}
