'use client'

import { FiToggleLeft, FiToggleRight } from 'react-icons/fi'

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
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export default function BusinessHours({ hours, onChange }: BusinessHoursProps) {
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
            <span className="font-medium text-stone-700 dark:text-stone-300">{DAYS[index].label}</span>
            <button
              type="button"
              onClick={() => updateHour(index, 'closed', !hour.closed)}
              className="flex items-center gap-2 text-sm transition"
            >
              {hour.closed ? (
                <>
                  <FiToggleLeft className="w-5 h-5 text-stone-400" />
                  <span className="text-stone-500 dark:text-stone-400">Fechado</span>
                </>
              ) : (
                <>
                  <FiToggleRight className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Aberto</span>
                </>
              )}
            </button>
          </div>

          {!hour.closed && (
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">Abertura</label>
                <input
                  type="time"
                  value={hour.openTime}
                  onChange={(e) => updateHour(index, 'openTime', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">Fechamento</label>
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
