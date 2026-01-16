"use client"

import StatsCard from '@/components/dashboard/StatsCard'
import MonthFilter from '@/components/dashboard/MonthFilter'
import MonthlyTopDishesChart from '@/components/dashboard/MonthlyTopDishesChart'
import { useTranslation } from '@/components/providers/I18nProvider'

interface DaySeries {
  day: number
  values: Record<string, number>
}

interface Series {
  id: string
  name: string
  color: string
}

interface DashboardShellProps {
  restaurantName: string
  monthKey: string
  availableMonths: string[]
  todayOrdersCount: number
  todayRevenue: number
  activeTablesCount: number | null
  chartData: DaySeries[]
  topDishSeries: Series[]
  daysInMonth: number
  recentOrders: any[]
}

export default function DashboardShell({
  restaurantName,
  monthKey,
  availableMonths,
  todayOrdersCount,
  todayRevenue,
  activeTablesCount,
  chartData,
  topDishSeries,
  daysInMonth,
  recentOrders,
}: DashboardShellProps) {
  const { t, locale } = useTranslation()

  // Format month label
  const [year, month] = monthKey.split('-').map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = monthDate.toLocaleDateString(locale || 'pt-BR', { month: 'long', year: 'numeric' })

  const hasSeries = topDishSeries.length > 0
  const hasData = chartData.length > 0 && hasSeries

  const fallbackSeries: Series = {
    id: 'placeholder',
    name: t('dashboard.noData') || 'Sem dados',
    color: '#9ca3af',
  }

  const normalizedSeries = hasSeries ? topDishSeries : [fallbackSeries]
  const normalizedData: DaySeries[] = hasData
    ? chartData.map((day) => ({
        day: day.day,
        values: normalizedSeries.reduce<Record<string, number>>((acc, s) => {
          acc[s.id] = day.values[s.id] ?? 0
          return acc
        }, {}),
      }))
    : Array.from({ length: daysInMonth }, (_, idx) => ({
        day: idx + 1,
        values: { [fallbackSeries.id]: 0 },
      }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8ecdd] via-[#f2d7b5] to-[#e5c39a] dark:from-[#0b1021] dark:via-[#12182a] dark:to-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-stone-600 dark:text-stone-400">{t('dashboard.overview')}</p>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">{restaurantName}</p>
          </div>
          <MonthFilter currentMonth={monthKey} months={availableMonths} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('dashboard.todayOrders') || 'Pedidos Hoje'}
            value={todayOrdersCount || 0}
            iconType="shopping"
            color="blue"
          />
          <StatsCard
            title={t('dashboard.todayRevenue') || 'Receita Hoje'}
            value={`R$ ${todayRevenue.toFixed(2)}`}
            iconType="dollar"
            color="green"
          />
          <StatsCard
            title={t('dashboard.activeTables') || 'Mesas Ativas'}
            value={activeTablesCount || 0}
            iconType="users"
            color="purple"
          />
          <StatsCard
            title={t('dashboard.avgOrderTime') || 'Tempo Médio'}
            value="15 min"
            iconType="clock"
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400">{t('dashboard.topDishes')}</p>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">{t('dashboard.salesPerDay')}</h2>
              </div>
            </div>
            <MonthlyTopDishesChart 
              data={normalizedData} 
              series={normalizedSeries} 
              emptyLabel={t('dashboard.noChartData')} 
              monthLabel={monthLabel}
            />
          </div>

          <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4">{t('dashboard.recentOrders')}</h2>
            <div className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? (
                (recentOrders as any[]).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-stone-50/80 dark:bg-white/5 border border-amber-500/10 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-white">
                        {t('orders.orderNumber')} {order.order_number}
                      </p>
                      <p className="text-sm text-stone-700 dark:text-stone-400">
                        {t('orders.table') || 'Mesa'} {order.tables?.table_number} • {order.order_items?.length || 0} {t('orders.items') || 'itens'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900 dark:text-white">
                        R$ {parseFloat(order.total_amount.toString()).toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                  {t('dashboard.noOrders')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
