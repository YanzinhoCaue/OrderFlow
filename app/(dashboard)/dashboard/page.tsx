import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import DashboardShell from '@/components/dashboard/DashboardShell'
import DashboardFallback from '@/components/dashboard/DashboardFallback'
import { redirect } from 'next/navigation'

interface DaySeries {
  day: number
  values: Record<string, number>
}

const CHART_COLORS = ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#ef4444']

function getMonthList(startDate: Date) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), 1)
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  if (start > end) start.setTime(end.getTime())

  const months: string[] = []
  const cursor = new Date(end)
  while (cursor >= start) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return months
}

function getMonthRange(monthKey?: string | string[]) {
  let targetMonth: Date
  if (monthKey && typeof monthKey === 'string') {
    targetMonth = new Date(monthKey + '-01')
  } else {
    targetMonth = new Date()
    targetMonth.setDate(1)
  }
  const start = new Date(targetMonth)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
  return { start, end, key }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // LOGGING: Diagnóstico de autenticação/redirect
  const allCookies = cookies().getAll();
  console.info('[DASHBOARD] INÍCIO');
  console.info('[DASHBOARD] COOKIES:', allCookies);
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.info('[DASHBOARD] USER:', user);
  if (!user) {
    return <DashboardFallback message="Usuário não autenticado." />;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  console.info('[DASHBOARD] PROFILE:', profile);
  if (!profile) {
    // Se não tem perfil, redireciona para onboarding
    redirect('/onboarding');
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', (profile as any).id)
    .single()

  if (!restaurant) {
    // Se não tem restaurante, redireciona para onboarding
    redirect('/onboarding');
  }

  const restaurantCreatedAt = (restaurant as any).created_at ? new Date((restaurant as any).created_at) : new Date()
  const availableMonths = getMonthList(restaurantCreatedAt)

  // Today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('restaurant_id', (restaurant as any).id)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  const todayOrdersCount = todayOrders?.length || 0
  const todayRevenue = todayOrders?.reduce((sum, order: any) => sum + parseFloat(order.total_amount.toString()), 0) || 0


  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      tables (table_number),
      order_items (
        *,
        dishes (name)
      )
    `)
    .eq('restaurant_id', (restaurant as any).id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Monthly chart data
  const { start: monthStart, end: monthEnd, key: monthKey } = getMonthRange(params?.month)
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const monthsForSelect = availableMonths.includes(monthKey) ? availableMonths : [monthKey, ...availableMonths]

  const { data: monthOrders } = await supabase
    .from('orders')
    .select('id, created_at')
    .eq('restaurant_id', (restaurant as any).id)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', monthEnd.toISOString())

  const orderIds = (monthOrders || []).map((o: any) => o.id)

  let chartData: DaySeries[] = []
  let topDishSeries: { id: string; name: string; color: string }[] = []

  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, dish_id, quantity, created_at')
      .in('order_id', orderIds)

    const orderDateMap = new Map(monthOrders?.map((o: any) => [o.id, o.created_at] as const))
    const dishTotals: Record<string, number> = {}
    const dishIds = Array.from(new Set((items || []).map((i: any) => i.dish_id)))

    // fetch dish names
    const { data: dishes } = dishIds.length
      ? await supabase.from('dishes').select('id, name').in('id', dishIds)
      : { data: [] as any }
    const dishNameMap = new Map((dishes || []).map((d: any) => [d.id, (typeof d.name === 'string' ? d.name : d.name?.ptBR || d.name?.['pt-BR'] || d.name?.en || 'Prato')]))

    chartData = Array.from({ length: daysInMonth }, (_, idx) => ({ day: idx + 1, values: {} }))

    for (const item of (items as any) || []) {
      const orderDate = orderDateMap.get(item.order_id)
      if (!orderDate) continue
      const d = new Date(orderDate)
      const day = d.getDate()
      const quantity = item.quantity || 0
      dishTotals[item.dish_id] = (dishTotals[item.dish_id] || 0) + quantity
      chartData[day - 1].values[item.dish_id] = (chartData[day - 1].values[item.dish_id] || 0) + quantity
    }

    const topDishIds = Object.entries(dishTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)

    topDishSeries = topDishIds.map((id, idx) => ({
      id,
      name: (dishNameMap.get(id) || 'Prato') as string,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }))

    chartData = chartData.map(day => {
      const values: Record<string, number> = {}
      topDishSeries.forEach(series => {
        values[series.id] = day.values[series.id] || 0
      })
      return { ...day, values }
    })
  }

  return (
    <DashboardShell
      restaurantName={(restaurant as any).name}
      monthKey={monthKey}
      availableMonths={monthsForSelect}
      todayOrdersCount={todayOrdersCount}
      todayRevenue={todayRevenue}
      chartData={chartData}
      topDishSeries={topDishSeries}
      daysInMonth={daysInMonth}
      recentOrders={(recentOrders as any[]) || []}
    />
  )
}
