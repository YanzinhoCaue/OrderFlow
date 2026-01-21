'use client'

import { FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { useTranslation } from '@/components/providers/I18nProvider'

export type BusinessHour = {
  day: string
  openTime: string
  closeTime: string
  closed: boolean
}

interface BusinessHoursProps {
  hours: BusinessHour[]
  onChange: (hours: BusinessHour[]) => void
}

const DAYS = [
  { key: 'monday', labelKey: 'common.monday' },
  { key: 'tuesday', labelKey: 'common.tuesday' },
  { key: 'wednesday', labelKey: 'common.wednesday' },
  { key: 'thursday', labelKey: 'common.thursday' },
  { key: 'friday', labelKey: 'common.friday' },
  { key: 'saturday', labelKey: 'common.saturday' },
  { key: 'sunday', labelKey: 'common.sunday' },
]

export default function BusinessHours({ hours, onChange }: BusinessHoursProps) {
  const { t } = useTranslation()
  
  const updateHour = (index: number, field: keyof BusinessHour, value: string | boolean) => {
    const newHours = [...hours]
    newHours[index] = { ...newHours[index], [field]: value }
    onChange(newHours)
  }

  return (
    <div className="space-y-4">
      {hours.map((hour, index) => (
        <div key={hour.day} className="p-4 bg-stone-50 dark:bg-white/5 rounded-lg border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-stone-700 dark:text-stone-300">{t(DAYS[index].labelKey)}</span>
            <button
              type="button"
              onClick={() => updateHour(index, 'closed', !hour.closed)}
              className="flex items-center gap-2 text-sm transition"
            >
              {hour.closed ? (
                <>
                  <FiToggleLeft className="w-5 h-5 text-stone-400" />
                  <span className="text-stone-500 dark:text-stone-400">{t('common.closed')}</span>
                </>
              ) : (
                <>
                  <FiToggleRight className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">{t('common.open')}</span>
                </>
              )}
            </button>
          </div>

          {!hour.closed && (
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">{t('common.openingTime')}</label>
                <input
                  type="time"
                  value={hour.openTime}
                  onChange={(e) => updateHour(index, 'openTime', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">{t('common.closingTime')}</label>
                <input
                  type="time"
                  value={hour.closeTime}
                  onChange={(e) => updateHour(index, 'closeTime', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
