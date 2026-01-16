"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiBell, FiSearch, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { markNotificationRead } from '@/app/actions/notifications'
import { updateOrderStatus } from '@/app/actions/orders'
import { getRelativeTime } from '@/lib/utils/date'

interface Notification {
  id: string
  target: 'waiter' | 'customer'
  type: 'accepted' | 'cancelled' | 'ready'
  message: string
  created_at: string
  read: boolean
  order_id: string | null
  orders?: {
    order_number: number
    status: string
    tables?: { table_number: string }
  }
}

interface WaiterClientProps {
  notifications: Notification[]
  restaurantId: string
}

export default function WaiterClient({ notifications, restaurantId }: WaiterClientProps) {
  const supabase = createClient()
  const [list, setList] = useState<Notification[]>(notifications)
  const [search, setSearch] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => setList(notifications), [notifications])

  useEffect(() => {
    const channel = supabase
      .channel('waiter-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setList((prev) => [payload.new as any, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setList((prev) => prev.map((n) => n.id === (payload.new as any).id ? (payload.new as any) : n))
        } else if (payload.eventType === 'DELETE') {
          setList((prev) => prev.filter((n) => n.id !== (payload.old as any).id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((n) => {
      const matchesUnread = onlyUnread ? !n.read : true
      const orderNo = n.orders?.order_number ? `#${n.orders.order_number}` : ''
      const tableNo = n.orders?.tables?.table_number || ''
      const matchesSearch = !q || n.message.toLowerCase().includes(q) || orderNo.toLowerCase().includes(q) || tableNo.toLowerCase().includes(q)
      return matchesUnread && matchesSearch
    })
  }, [list, search, onlyUnread])

  const markRead = (id: string) => {
    startTransition(async () => {
      setPendingId(id)
      await markNotificationRead(id)
      setList((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
      setPendingId(null)
    })
  }

  const markDelivered = (orderId: string | null, notificationId?: string) => {
    if (!orderId) return
    startTransition(async () => {
      setPendingId(notificationId || null)
      await updateOrderStatus(orderId, 'delivered' as any)
      if (notificationId) {
        await markNotificationRead(notificationId)
        setList((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n))
      }
      setPendingId(null)
    })
  }

  const summary = useMemo(() => {
    return list.reduce((acc, n) => {
      acc.total++
      if (!n.read) acc.unread++
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, { total: 0, unread: 0, accepted: 0, cancelled: 0, ready: 0 } as any)
  }, [list])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">Operação</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            Garçom
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            Acompanhe notificações de pedidos prontos e aceitos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
            {summary.unread} novas
          </span>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mesa, pedido ou mensagem..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
            Mostrar apenas não lidas
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">Nenhuma notificação</h3>
          <p className="text-stone-600 dark:text-stone-400">Aguarde pedidos sendo preparados ou aceitos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((n) => {
            const isReady = n.type === 'ready'
            const orderNo = n.orders?.order_number ? `#${n.orders.order_number}` : ''
            const tableNo = n.orders?.tables?.table_number || ''
            return (
              <div key={n.id} className="group bg-white/90 dark:bg-white/5 border-2 border-amber-500/15 rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                        <FiBell />
                        <span>{orderNo} • Mesa {tableNo}</span>
                      </div>
                      <p className="text-sm text-stone-700 dark:text-stone-300 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <FiClock />
                        <span>{getRelativeTime(n.created_at)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      n.type === 'cancelled'
                        ? 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30'
                        : n.type === 'ready'
                        ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30'
                        : 'bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30'
                    }`}>
                      {n.type === 'cancelled' ? 'Cancelado' : n.type === 'ready' ? 'Pronto' : 'Aceito'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {isReady && (
                      <Button
                        onClick={() => markDelivered(n.order_id, n.id)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20"
                        disabled={isPending && pendingId === n.id}
                      >
                        <FiCheckCircle className="mr-2" />
                        Servir / Entregar
                      </Button>
                    )}
                    <Button
                      onClick={() => markRead(n.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-amber-500/30 text-amber-700 dark:text-amber-300"
                      disabled={isPending && pendingId === n.id}
                    >
                      Marcar como lida
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
