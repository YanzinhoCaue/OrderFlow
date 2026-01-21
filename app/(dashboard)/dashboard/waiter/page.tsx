import { getRestaurantByOwner } from '@/app/actions/categories'
import { getWaiterNotifications } from '@/app/actions/notifications'
import { cookies } from 'next/headers'
import { getDictionary, translate } from '@/lib/i18n/server'
import WaiterClient from './WaiterClient'

export default async function WaiterPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as any) || 'pt-BR'
  const dict = await getDictionary(locale)
  const t = (key: string) => translate(dict, key)

  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>{t('common.error')}</div>
  }

  const notifications = await getWaiterNotifications((restaurant as any).id)

  return (
    <WaiterClient 
      notifications={notifications as any[]} 
      restaurantId={(restaurant as any).id}
      labels={{
        title: t('dashboardWaiter.title'),
        heading: t('dashboardWaiter.heading'),
        subtitle: t('dashboardWaiter.subtitle'),
        readyOrders: t('dashboardWaiter.readyOrders'),
        delivered: t('dashboardWaiter.delivered'),
        noOrders: t('dashboardWaiter.noOrders'),
        deliver: t('dashboardWaiter.deliver'),
        markAsDelivered: t('dashboardWaiter.markAsDelivered'),
        table: t('dashboardWaiter.table'),
        notifications: t('dashboardWaiter.notifications'),
        deliveredToday: t('dashboardWaiter.deliveredToday'),
        clearAll: t('dashboardWaiter.clearAll'),
        noNotifications: t('dashboardWaiter.noNotifications'),
        searchPlaceholder: t('dashboardWaiter.searchPlaceholder'),
        onlyUnread: t('dashboardWaiter.onlyUnread'),
        emptyDescription: t('dashboardWaiter.emptyDescription'),
        statusCancelled: t('dashboardWaiter.statusCancelled'),
        statusReady: t('dashboardWaiter.statusReady'),
        statusAccepted: t('dashboardWaiter.statusAccepted'),
        markAsRead: t('dashboardWaiter.markAsRead'),
      }}
    />
  )
}
