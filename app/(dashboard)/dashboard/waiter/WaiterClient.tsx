"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { FiClock, FiUser, FiCheck, FiSearch, FiBell, FiCheckCircle, FiX, FiTrash2 } from 'react-icons/fi'
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order-status'
import { getRelativeTime } from '@/lib/utils/date'
import { updateOrderStatus } from '@/app/actions/orders'
import { OrderStatus } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { markNotificationRead } from '@/app/actions/notifications'

interface WaiterNotification {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
  order_id?: string
  orders?: {
    order_number: number
    tables?: {
      table_number: string
    }
  }
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number | string
  total_price: number | string
  notes?: string | null
  dishes: { name: string }
  order_item_ingredients?: any[]
}

interface Order {
  id: string
  order_number: number
  table_id: string
  status: OrderStatus
  total_amount: number | string
  customer_name?: string | null
  notes?: string | null
  created_at: string
  tables: { table_number: string }
  order_items: OrderItem[]
}

interface WaiterClientProps {
  notifications: WaiterNotification[]
  restaurantId: string
  labels?: {
    title: string
    heading: string
    subtitle: string
    readyOrders: string
    delivered: string
    noOrders: string
    deliver: string
    markAsDelivered: string
    table: string
    notifications: string
    deliveredToday: string
    clearAll: string
    noNotifications: string
    searchPlaceholder: string
    onlyUnread: string
    emptyDescription: string
    statusCancelled: string
    statusReady: string
    statusAccepted: string
    markAsRead: string
  }
}

export default function WaiterClient({ notifications, restaurantId, labels }: WaiterClientProps) {
  const supabase = createClient()
  const [list, setList] = useState<WaiterNotification[]>(notifications)
  const [search, setSearch] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 112, left: 0 })
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [dropdownDismissed, setDropdownDismissed] = useState<Record<string, boolean>>({})
  const [deliveredCount, setDeliveredCount] = useState(0)

  useEffect(() => setMounted(true), [])
  useEffect(() => setList(notifications), [notifications])

  const todayKey = () => new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('waiter-delivered')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.date === todayKey()) {
          setDeliveredCount(parsed.count || 0)
        } else {
          window.localStorage.setItem('waiter-delivered', JSON.stringify({ date: todayKey(), count: 0 }))
        }
      } else {
        window.localStorage.setItem('waiter-delivered', JSON.stringify({ date: todayKey(), count: 0 }))
      }
    } catch (err) {
      console.error('Erro ao carregar contador de entregas:', err)
    }
  }, [])

  // Restore notificações descartadas da sessão
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('waiter-dismissed')
      if (stored) {
        const parsed = JSON.parse(stored)
        setDismissed(parsed)
      }
    } catch (err) {
      console.error('Erro ao carregar descartes locais:', err)
    }
  }, [])

  const persistDismissed = (next: Record<string, boolean>) => {
    setDismissed(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('waiter-dismissed', JSON.stringify(next))
    }
  }

  const incrementDelivered = () => {
    const next = deliveredCount + 1
    setDeliveredCount(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('waiter-delivered', JSON.stringify({ date: todayKey(), count: next }))
    }
  }

  const dismissInDropdown = (id: string) => {
    setDropdownDismissed((prev) => ({ ...prev, [id]: true }))
  }

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const width = 320
    const top = rect.bottom + 8
    const left = Math.min(
      Math.max(16, rect.right - width),
      window.innerWidth - width - 16
    )
    setDropdownPos({ top, left })
  }

  useEffect(() => {
    if (!showNotifications) return
    updateDropdownPosition()
    const handleResize = () => updateDropdownPosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [showNotifications])


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotifications && !target.closest('.notification-dropdown-waiter')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  useEffect(() => {
    const channel = supabase
      .channel('waiter-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        const data = payload as any
        console.log('🔔 [GARÇOM] Notificação recebida:', data)
        if (data.eventType === 'INSERT') {
          setList((prev) => [data.new as any, ...prev])
        } else if (data.eventType === 'UPDATE') {
          setList((prev) => prev.map((n) => n.id === (data.new as any).id ? (data.new as any) : n))
        } else if (data.eventType === 'DELETE') {
          setList((prev) => prev.filter((n) => n.id !== (data.old as any).id))
        }
      })
      .subscribe((status) => {
        console.log('🔌 [GARÇOM] Status da subscrição:', status)
      })

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((n) => {
      if (dismissed[n.id]) return false
      if (n.type === 'accepted') return false
      const matchesUnread = onlyUnread ? !n.read : true
      const orderNo = n.orders?.order_number ? `#${n.orders.order_number}` : ''
      const tableNo = n.orders?.tables?.table_number || ''
      const matchesSearch = !q || n.message.toLowerCase().includes(q) || orderNo.toLowerCase().includes(q) || tableNo.toLowerCase().includes(q)
      return matchesUnread && matchesSearch
    })
  }, [list, search, onlyUnread, dismissed])

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
        setList((prev) => prev.filter((n) => n.id !== notificationId))
        persistDismissed({ ...dismissed, [notificationId]: true })
        setDropdownDismissed((prev) => ({ ...prev, [notificationId]: true }))
      }
      incrementDelivered()
      setPendingId(null)
    })
  }

  const handleDeleteNotification = async (id: string) => {
    // Apenas marca como lida e esconde no dropdown; mantém card na lista
    startTransition(async () => {
      setPendingId(id)
      await markNotificationRead(id)
      setList((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
      dismissInDropdown(id)
      setPendingId(null)
    })
  }

  const handleClearAllNotifications = async () => {
    // Marca todas como lidas e esconde apenas no dropdown; cards permanecem
    startTransition(async () => {
      await Promise.all(list.map((n) => markNotificationRead(n.id)))
      setList((prev) => prev.map((n) => ({ ...n, read: true })))
      const dismissedMap = list.reduce((acc, n) => { acc[n.id] = true; return acc }, {} as Record<string, boolean>)
      setDropdownDismissed(dismissedMap)
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
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">{labels?.heading ?? 'Operação'}</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            {labels?.title ?? 'Garçom'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            {labels?.subtitle ?? 'Acompanhe notificações de pedidos prontos e aceitos'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              ref={buttonRef}
              className="relative px-3 py-1.5 rounded-full text-xs font-semibold border bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30 flex items-center gap-2 hover:bg-amber-100/70 dark:hover:bg-amber-500/20 transition-colors"
            >
              <FiBell size={16} />
              {summary.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {summary.unread}
                </span>
              )}
              {labels?.notifications ?? 'Notificações'}
            </button>
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 px-3 py-1 rounded-full bg-stone-100/70 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/60">
              {(labels?.deliveredToday ?? 'Entregues hoje') + ': ' + deliveredCount}
            </span>
            
            {mounted && showNotifications && createPortal(
              <div className="fixed inset-0 z-[99998]" onClick={() => setShowNotifications(false)} />,
              document.body
            )}
            
            {mounted && showNotifications && createPortal(
              <div
                className="fixed w-80 bg-white dark:bg-stone-900 border-2 border-amber-500/20 rounded-xl shadow-2xl z-[99999] max-h-96 overflow-y-auto notification-dropdown-waiter"
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
              >
                <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-amber-500/20 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBell size={18} className="text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-sm">{labels?.notifications ?? 'Notificações'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {list.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        disabled={isPending}
                      >
                        {labels?.clearAll ?? 'Limpar tudo'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <FiBell size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">{labels?.noNotifications ?? 'Nenhuma notificação'}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-amber-500/10">
                      {list.filter((n) => !dropdownDismissed[n.id]).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-colors ${
                            !notif.read ? 'bg-amber-50/30 dark:bg-amber-500/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                {notif.message}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                {new Date(notif.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotification(notif.id)
                              }}
                              className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                              disabled={isPending && pendingId === notif.id}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6 space-y-4 -z-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg z-0">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 z-0" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels?.searchPlaceholder ?? 'Buscar por mesa, pedido ou mensagem...'}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all z-0"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
            {labels?.onlyUnread ?? 'Mostrar apenas não lidas'}
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">{labels?.noNotifications ?? 'Nenhuma notificação'}</h3>
          <p className="text-stone-600 dark:text-stone-400">{labels?.emptyDescription ?? 'Aguarde pedidos sendo preparados ou aceitos'}</p>
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
                        <span>{orderNo} • {(labels?.table ?? 'Mesa')} {tableNo}</span>
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
                      {n.type === 'cancelled' ? (labels?.statusCancelled ?? 'Cancelado') : n.type === 'ready' ? (labels?.statusReady ?? 'Pronto') : (labels?.statusAccepted ?? 'Aceito')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {isReady && (
                      <button
                        onClick={() => markDelivered(n.order_id, n.id)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold transition-all active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        disabled={isPending && pendingId === n.id}
                      >
                        <FiCheckCircle size={16} />
                        {labels?.deliver ?? 'Entregar'}
                      </button>
                    )}
                    <button
                      onClick={() => markRead(n.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm border-2 border-amber-500/30 bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all shadow-lg hover:shadow-xl"
                      disabled={isPending && pendingId === n.id}
                    >
                      {labels?.markAsRead ?? 'Marcar como lida'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
