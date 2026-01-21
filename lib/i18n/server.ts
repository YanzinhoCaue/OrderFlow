import fs from 'fs'
import path from 'path'
import { LocaleCode, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/constants/locales'

export type Dictionary = Record<string, any>

export async function getDictionary(locale: LocaleCode): Promise<Dictionary> {
  const safeLocale = SUPPORTED_LOCALES.some((l) => l.code === locale) ? locale : DEFAULT_LOCALE
  const filePath = path.join(process.cwd(), 'i18n', 'locales', `${safeLocale}.json`)
  const raw = await fs.promises.readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

export function translate(dict: Dictionary, key: string, params?: Record<string, string | number>): string {
  const parts = key.split('.')
  let value: any = dict
  for (const p of parts) {
    if (value && typeof value === 'object' && p in value) {
      value = value[p]
    } else {
      return key
    }
  }
  if (typeof value !== 'string') return key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{{${k}}}`, String(v))
    })
  }
  return value
}
