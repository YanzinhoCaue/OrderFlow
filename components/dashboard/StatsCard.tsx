'use client'

import { FiShoppingBag, FiDollarSign, FiUsers, FiClock } from 'react-icons/fi'

interface StatsCardProps {
  title: string
  value: string | number
  iconType: 'shopping' | 'dollar' | 'users' | 'clock'
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
  red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
}

const iconMap = {
  shopping: FiShoppingBag,
  dollar: FiDollarSign,
  users: FiUsers,
  clock: FiClock,
}

export default function StatsCard({ title, value, iconType, color }: StatsCardProps) {
  const Icon = iconMap[iconType]
  
  return (
    <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
