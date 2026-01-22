'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationTarget = 'waiter' | 'customer'
export type NotificationType = 'accepted' | 'cancelled' | 'ready'

export async function getWaiterNotifications(restaurantId: string, onlyUnread: boolean = false) {
  const supabase = await createClient()

  // Fetch notifications (basic fields only to avoid deep join issues)
  let notifQuery = (supabase as any)
    .from('notifications')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('target', 'waiter')
    .order('created_at', { ascending: false })

  if (onlyUnread) notifQuery = notifQuery.eq('read', false)

  const { data: notifications, error: notifError } = await notifQuery
  if (notifError || !notifications) {
    // Fail gracefully (likely migrations/policies not applied yet)
    return []
  }

  // Enrich with order info in a second step
  const orderIds = notifications.map((n) => n.order_id).filter(Boolean)
  let ordersMap: Record<string, any> = {}
  let tablesMap: Record<string, any> = {}

  if (orderIds.length > 0) {
    const { data: orders, error: ordersError } = await (supabase as any)
      .from('orders')
      .select('id, order_number, status, table_id')
      .in('id', orderIds as string[])

    if (!ordersError && orders && orders.length > 0) {
      ordersMap = orders.reduce((acc, o) => { acc[o.id] = o; return acc }, {} as Record<string, any>)
      const tableIds = orders.map((o) => o.table_id).filter(Boolean)
      if (tableIds.length > 0) {
        const { data: tables, error: tablesError } = await (supabase as any)
          .from('tables')
          .select('id, table_number')
          .in('id', tableIds as string[])
        if (!tablesError && tables && tables.length > 0) {
          tablesMap = tables.reduce((acc, t) => { acc[t.id] = t; return acc }, {} as Record<string, any>)
        }
      }
    }
  }

  // Attach lightweight order info to notifications
  const enriched = notifications.map((n) => {
    const o = n.order_id ? ordersMap[n.order_id] : null
    const t = o?.table_id ? tablesMap[o.table_id] : null
    return {
      ...n,
      orders: o ? { order_number: o.order_number, status: o.status, tables: t ? { table_number: t.table_number } : null } : null,
    }
  })

  return enriched
}

export async function markNotificationRead(notificationId: string) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error

    revalidatePath('/dashboard/waiter')
    return { success: true }
  } catch (error) {
    console.error('Error marking notification read:', error)
    return { success: false, error: 'Falha ao marcar notificação como lida' }
  }
}
