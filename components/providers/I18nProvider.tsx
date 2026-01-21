'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LocaleCode, DEFAULT_LOCALE } from '@/lib/constants/locales'
import ptBR from '@/i18n/locales/pt-BR.json'
import en from '@/i18n/locales/en.json'
import es from '@/i18n/locales/es.json'
import zh from '@/i18n/locales/zh.json'
import ja from '@/i18n/locales/ja.json'

type Translations = Record<string, any>

interface I18nContextType {
  locale: LocaleCode
  setLocale: (locale: LocaleCode) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Static mapping of translations
const translationMap: Record<LocaleCode, Translations> = {
  'pt-BR': ptBR,
  en: en,
  es: es,
  zh: zh,
  ja: ja,
}

// Get translations synchronously
function getTranslations(locale: LocaleCode): Translations {
  return translationMap[locale] || translationMap[DEFAULT_LOCALE]
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Initialize locale from cookie or localStorage to keep dashboard/public menu in sync
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    if (typeof window !== 'undefined') {
      const cookieMatch = document.cookie.match(/(?:^|; )locale=([^;]+)/)
      if (cookieMatch) {
        const decodedLocale = decodeURIComponent(cookieMatch[1]) as LocaleCode
        const validLocales: LocaleCode[] = ['pt-BR', 'en', 'es', 'zh', 'ja']
        if (validLocales.includes(decodedLocale)) return decodedLocale
      }
      const saved = localStorage.getItem('locale') as LocaleCode | null
      const validLocales: LocaleCode[] = ['pt-BR', 'en', 'es', 'zh', 'ja']
      if (saved && validLocales.includes(saved)) return saved
    }
    return DEFAULT_LOCALE
  })

  // Load translations synchronously
  const translations = getTranslations(locale)

  // Persist locale for both dashboard and public menu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
      document.cookie = `locale=${encodeURIComponent(locale)}; path=/; max-age=${60 * 60 * 24 * 365}`
      document.documentElement.lang = locale
    }
  }, [locale])

  const setLocale = (newLocale: LocaleCode) => {
    setLocaleState(newLocale)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{{${paramKey}}}`, String(paramValue))
      })
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider')
  }
  return context
}
