'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslation } from '@/components/providers/I18nProvider'

interface MonthFilterProps {
  currentMonth: string
  months: string[]
}

export default function MonthFilter({ currentMonth, months }: MonthFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { locale, t } = useTranslation()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('month', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const monthList = months && months.length > 0 ? months : [currentMonth]
  const options = monthList.map((value) => {
    const [year, month] = value.split('-').map(Number)
    const date = new Date(year, (month || 1) - 1, 1)
    const label = date.toLocaleDateString(locale || 'pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  return (
    <div className="relative bg-white/85 dark:bg-white/5 border border-amber-500/20 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-xl">
      <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1 font-semibold">{t('dashboard.month') || 'Mês'}</label>
      <select
        value={currentMonth}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm w-full bg-stone-50/80 dark:bg-stone-900/30 border border-amber-500/30 dark:border-amber-500/40 text-stone-900 dark:text-stone-100 rounded-lg px-3 py-2 pr-10 outline-none appearance-none hover:border-amber-500/50 dark:hover:border-amber-500/60 focus:border-amber-500/70 dark:focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/30 transition-all"
      >
        {options.map((opt) => (
          <option 
            key={opt.value} 
            value={opt.value} 
            className="bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-6 top-1/2 text-amber-700 dark:text-amber-300 text-xs">▼</div>
    </div>
  )
}
