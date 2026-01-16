'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LocaleCode, DEFAULT_LOCALE } from '@/lib/constants/locales'

const localeLoaders: Record<LocaleCode, () => Promise<any>> = {
  'pt-BR': () => import('@/i18n/locales/pt-BR.json'),
  en: () => import('@/i18n/locales/en.json'),
  es: () => import('@/i18n/locales/es.json'),
  zh: () => import('@/i18n/locales/zh.json'),
  ja: () => import('@/i18n/locales/ja.json'),
}

type Translations = Record<string, any>

interface I18nContextType {
  locale: LocaleCode
  setLocale: (locale: LocaleCode) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE)
  const [translations, setTranslations] = useState<Translations>({})

  useEffect(() => {
    // Load translations for current locale
    const loadTranslations = async () => {
      try {
        const loader = localeLoaders[locale]
        if (!loader) throw new Error(`No loader for locale ${locale}`)
        const data = await loader()
        setTranslations(data.default)
      } catch (error) {
        console.error(`Failed to load translations for ${locale}`, error)
      }
    }

    loadTranslations()

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
    }
  }, [locale])

  useEffect(() => {
    // Load saved locale from localStorage
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as LocaleCode
      if (savedLocale) {
        setLocaleState(savedLocale)
      }
    }
  }, [])

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
