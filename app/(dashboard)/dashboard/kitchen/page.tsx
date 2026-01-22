'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus, acceptOrder, refuseOrder, markOrderReady, deleteOrder, reopenOrder } from '@/app/actions/orders'
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order-status'
import { formatDateTime } from '@/lib/utils/date'
import Button from '@/components/ui/Button'
import { FiClock, FiCheck, FiBell, FiPackage, FiShoppingBag, FiCheckCircle, FiXCircle, FiMeh, FiZap, FiTarget, FiSmile, FiX, FiTrash2, FiPrinter, FiPlay, FiRotateCcw } from 'react-icons/fi'
import { printThermalReceipt } from '@/components/print/ThermalReceiptPrint'
import { useTranslation } from '@/components/providers/I18nProvider'

// Normalize multilingual fields
const normalizeField = (field: any): string => {
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field !== null) {
    return field['pt-BR'] || field['en'] || JSON.stringify(field)
  }
  return String(field)
}

interface Order {
  id: string
  order_number: number
  status: string
  created_at: string
  customer_name: string | null
  tables: { table_number: string }
  order_items: {
    id: string
    quantity: number
    unit_price: number
    total_price: number
    dishes: { name: string }
    notes: string | null
    order_item_ingredients?: Array<{
      id: string
      was_added: boolean
      ingredients: { name: string }
    }>
  }[]
}

export default function KitchenPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 112, left: 0 })
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates for orders
    const ordersChannel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders()
        }
      )
      .subscribe()

    // Subscribe to notifications for kitchen
    const notificationsChannel = supabase
      .channel('kitchen-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `target=eq.kitchen`,
      }, (payload) => {
        const data = payload as any
        console.log('🔔 [COZINHA] Notificação recebida via Realtime:', data)
        console.log('   - Event Type:', data.eventType)
        console.log('   - Target:', data.new?.target)
        console.log('   - Type:', data.new?.type)
        console.log('   - Message:', data.new?.message)
        
        if (data.eventType === 'INSERT') {
          const newNotification = {
            id: data.new.id,
            title: 'Nova Notificação',
            message: data.new.message,
            type: data.new.type,
            timestamp: new Date(),
          }
          setNotifications(prev => {
            const updated = [newNotification, ...prev]
            console.log('✅ [COZINHA] Notificação adicionada. Total:', updated.length)
            return updated
          })
        }
      })
      .subscribe((status) => {
        console.log('🔌 [COZINHA] Status da subscrição de notificações:', status)
      })

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotifications && !target.closest('.notification-dropdown-kitchen')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  // Load dismissed notifications (local only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('kitchen-dismissed')
      if (stored) setDismissed(JSON.parse(stored))
    } catch (err) {
      console.error('Erro ao carregar descartes da cozinha:', err)
    }
  }, [])

  const persistDismissed = (next: Record<string, boolean>) => {
    setDismissed(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('kitchen-dismissed', JSON.stringify(next))
    }
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


  const loadOrders = async () => {
    console.log('📚 loadOrders iniciado')
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `*,
          tables (table_number),
          order_items (
            *,
            dishes (name),
            order_item_ingredients (
              id,
              was_added,
              ingredients (name)
            )
          )`
        )
        .in('status', ['pending', 'received', 'in_preparation', 'ready', 'cancelled'])
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Normalize multilingual fields
      const normalized = (data || []).map((order: any) => ({
        ...order,
        order_items: order.order_items.map((item: any) => ({
          ...item,
          dishes: {
            ...item.dishes,
            name: normalizeField(item.dishes.name)
          },
          order_item_ingredients: item.order_item_ingredients?.map((ing: any) => ({
            ...ing,
            ingredients: {
              ...ing.ingredients,
              name: normalizeField(ing.ingredients.name)
            }
          }))
        }))
      }))
      
      setOrders(normalized as Order[])
      console.log('✅ loadOrders concluído - total de pedidos:', normalized.length)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    await updateOrderStatus(orderId, newStatus)
    loadOrders()
  }

  const handleAccept = async (orderId: string, prepTime: 15 | 30 | 60 | 90) => {
    await acceptOrder(orderId, prepTime)
    loadOrders()
  }

  const handleReject = async (orderId: string, reason: string) => {
    console.log('📋 handleReject iniciado - orderId:', orderId, 'reason:', reason)
    if (!reason?.trim()) {
      console.log('⚠️ Motivo vazio, cancelando')
      return
    }
    try {
      console.log('🚀 Chamando refuseOrder...')
      const result = await refuseOrder(orderId, reason.trim())
      console.log('📦 Resultado de refuseOrder:', result)
      console.log('🔄 Recarregando pedidos...')
      await loadOrders()
      console.log('✅ Pedido recusado e movido para a aba de recusados')
    } catch (error) {
      console.error('❌ Erro ao recusar pedido:', error)
      alert('Erro ao recusar pedido: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleReady = async (orderId: string) => {
    await markOrderReady(orderId)
    loadOrders()
  }

  const handleDelete = async (orderId: string) => {
    if (confirm('Tem certeza que deseja deletar este pedido? Esta ação não pode ser desfeita.')) {
      const result = await deleteOrder(orderId)
      if (result.success) {
        loadOrders()
        alert('✅ Pedido deletado com sucesso')
      } else {
        alert('❌ Erro ao deletar pedido: ' + result.error)
      }
    }
  }

  const handleReopen = async (orderId: string) => {
    const result = await reopenOrder(orderId)
    if (result.success) {
      loadOrders()
    } else {
      alert('Erro ao reabrir pedido: ' + result.error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Marca como lida e remove apenas da lista local (não toca em pedidos)
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('target', 'kitchen')

      if (error) throw error

      persistDismissed({ ...dismissed, [notificationId]: true })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      const notificationIds = notifications.map(n => n.id)

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .eq('target', 'kitchen')

      if (error) throw error

      const allDismissed = { ...dismissed }
      notificationIds.forEach(id => { allDismissed[id] = true })
      persistDismissed(allDismissed)
      setNotifications([])
    } catch (error) {
      console.error('Erro ao limpar notificações:', error)
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'in_preparation'
      case 'in_preparation':
        return 'ready'
      default:
        return null
    }
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const inPreparationOrders = orders.filter((o) => o.status === 'in_preparation')
  const readyOrders = orders.filter((o) => o.status === 'ready')
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl relative">
          <div>
            <p className="text-sm text-stone-600 dark:text-stone-400">{t('dashboardKitchen.operation')}</p>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
              {t('dashboardKitchen.heading')}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
              {t('dashboardKitchen.subtitle')}
            </p>
          </div>
          
          {/* Notification Bell */}
          <div className="relative notification-dropdown-kitchen">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              ref={buttonRef}
              className="relative px-3 py-1.5 rounded-full text-xs font-semibold border bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30 flex items-center gap-2 hover:bg-amber-100/70 dark:hover:bg-amber-500/20 transition-colors shadow-lg"
            >
              <FiBell size={16} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
              {t('dashboardKitchen.notifications')}
            </button>

            {mounted && showNotifications && createPortal(
              <div className="fixed inset-0 z-[99998]" onClick={() => setShowNotifications(false)} />,
              document.body
            )}

            {/* Notifications Dropdown - FIXED positioning */}
            {mounted && showNotifications && createPortal(
              <div
                className="fixed w-80 bg-white dark:bg-stone-900 border-2 border-amber-500/20 rounded-xl shadow-2xl z-[99999] max-h-96 overflow-y-auto notification-dropdown-kitchen"
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
              >
                <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-amber-500/20 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBell size={18} className="text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-sm">{t('dashboardKitchen.notifications')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        {t('dashboardKitchen.clearAll')}
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
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <FiBell size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-amber-500/10">
                      {notifications.filter((n) => !dismissed[n.id]).map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                {notif.message}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                {notif.timestamp.toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteNotification(notif.id)}
                              className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 z-0">
        {/* Pending Column */}
        <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl z-0">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-600 dark:to-yellow-700 rounded-t-lg p-5 border-b-4 border-yellow-600">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <FiShoppingBag size={22} />
              {t('dashboardKitchen.newOrders')}
              <span className="ml-auto bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {pendingOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4 p-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/70 dark:to-gray-900/50 min-h-[600px]">
            {pendingOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                  <FiMeh size={48} className="mx-auto mb-2" />
                  <p>{t('dashboardKitchen.noNewOrders')}</p>
                </div>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onReady={handleReady}
                  onDelete={handleDelete}
                  getNextStatus={getNextStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* In Preparation Column */}
        <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-600 dark:to-orange-700 rounded-t-lg p-5 border-b-4 border-orange-600">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <FiPackage size={22} />
              {t('dashboardKitchen.inPreparation')}
              <span className="ml-auto bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {inPreparationOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4 p-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/70 dark:to-gray-900/50 min-h-[600px]">
            {inPreparationOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                  <FiZap size={48} className="mx-auto mb-2" />
                  <p>{t('dashboardKitchen.noInPreparation')}</p>
                </div>
              </div>
            ) : (
              inPreparationOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onReady={handleReady}
                  onDelete={handleDelete}
                  getNextStatus={getNextStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* Ready/Finalized Column */}
        <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl">
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-700 rounded-t-lg p-5 border-b-4 border-emerald-600">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <FiCheckCircle size={22} />
              {t('dashboardKitchen.completed')}
              <span className="ml-auto bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {readyOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4 p-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/70 dark:to-gray-900/50 min-h-[600px]">
            {readyOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                  <FiTarget size={48} className="mx-auto mb-2" />
                  <p>{t('dashboardKitchen.noCompleted')}</p>
                </div>
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onReady={handleReady}
                  onDelete={handleDelete}
                  getNextStatus={getNextStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* Cancelled/Refused Column */}
        <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl">
          <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 rounded-t-lg p-5 border-b-4 border-red-700">
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <FiXCircle size={22} />
              {t('dashboardKitchen.rejected')}
              <span className="ml-auto bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {cancelledOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4 p-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/70 dark:to-gray-900/50 min-h-[600px]">
            {cancelledOrders.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                  <FiSmile size={48} className="mx-auto mb-2" />
                  <p>{t('dashboardKitchen.noRejected')}</p>
                </div>
              </div>
            ) : (
              cancelledOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onReady={handleReady}
                  onDelete={handleDelete}
                  onReopen={handleReopen}
                  getNextStatus={getNextStatus}
                />
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

function OrderCard({
  order,
  onStatusChange,
  onAccept,
  onReject,
  onReady,
  onDelete,
  onReopen,
  getNextStatus,
}: {
  order: Order
  onStatusChange: (orderId: string, status: any) => void
  onAccept: (orderId: string, prepTime: 15 | 30 | 60 | 90) => void
  onReject: (orderId: string, reason: string) => void
  onReady: (orderId: string) => void
  onDelete: (orderId: string) => void
  onReopen?: (orderId: string) => void
  getNextStatus: (status: string) => string | null
}) {
  const [prepTime, setPrepTime] = useState<15 | 30 | 60 | 90>(30)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const nextStatus = getNextStatus(order.status)
  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg p-3 border-l-4 border-primary transition-all duration-200">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
            #{order.order_number}
          </h3>
          <div className="flex gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
              Mesa {order.tables.table_number}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
              <FiClock size={12} />
              {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        {order.customer_name && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">
            👤 {order.customer_name.substring(0, 10)}
          </div>
        )}
      </div>

      {/* Itens compactos */}
      <div className="mb-2.5 bg-gray-50 dark:bg-gray-900/30 rounded p-2.5 space-y-1.5">
        {order.order_items.map((item) => (
          <div key={item.id}>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                {item.quantity}
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {item.dishes.name}
              </span>
            </div>
            
            {/* Ingredientes em uma linha */}
            {item.order_item_ingredients && item.order_item_ingredients.length > 0 && (
              <div className="mt-1 ml-6 flex flex-wrap gap-1">
                {item.order_item_ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      ing.was_added
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    }`}
                  >
                    {ing.was_added ? '✓' : '✕'} {ing.ingredients.name}
                  </div>
                ))}
              </div>
            )}
            
            {item.notes && (
              <p className="text-xs text-gray-600 dark:text-gray-400 italic ml-6 mt-0.5">
                📝 {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Botões compactos */}
      <div className="flex gap-1.5 flex-wrap">
        {order.status === 'pending' && (
          <>
            <select
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value) as 15 | 30 | 60 | 90)}
              aria-label="Tempo de preparo"
              title="Selecione o tempo de preparo"
              className="px-2 py-1 rounded text-xs border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/40 font-medium text-gray-700 dark:text-amber-300 hover:bg-amber-100 transition-colors"
            >
              <option value={15}>15m</option>
              <option value={30}>30m</option>
              <option value={60}>60m</option>
              <option value={90}>90m</option>
            </select>
            <button 
              onClick={() => onAccept(order.id, prepTime)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold transition-all active:scale-95 flex-1 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl"
            >
              <FiCheck size={14} /> OK
            </button>
            <button 
              onClick={() => setShowReject(true)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FiX size={14} />
            </button>
            <button 
              onClick={() => printOrder(order)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FiPrinter size={14} />
            </button>
          </>
        )}
        {order.status === 'received' && (
          <button 
            onClick={() => onStatusChange(order.id, 'in_preparation')} 
            className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold transition-all active:scale-95 w-full flex items-center justify-center gap-1 shadow-lg hover:shadow-xl"
          >
            <FiPlay size={14} /> Iniciar
          </button>
        )}
        {order.status === 'in_preparation' && (
          <button 
            onClick={() => onReady(order.id)} 
            className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold transition-all active:scale-95 w-full flex items-center justify-center gap-1 shadow-lg hover:shadow-xl"
          >
            <FiCheck size={14} /> Pronto
          </button>
        )}
        {order.status === 'ready' && (
          <>
            <button 
              onClick={() => onDelete(order.id)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all active:scale-95 flex-1 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FiTrash2 size={14} />
            </button>
            <button 
              onClick={() => printOrder(order)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FiPrinter size={14} />
            </button>
          </>
        )}
        {order.status === 'cancelled' && onReopen && (
          <>
            <button 
              onClick={() => onReopen(order.id)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold transition-all active:scale-95 flex-1 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FiRotateCcw size={14} />
            </button>
            <button 
              onClick={() => onDelete(order.id)} 
              className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <FiTrash2 size={14} />
            </button>
          </>
        )}
        {(order.status === 'received' || order.status === 'in_preparation') && (
          <button 
            onClick={() => printOrder(order)} 
            className="px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl"
          >
            <FiPrinter size={14} />
          </button>
        )}
      </div>

      {/* Modal de recusa compacto */}
      {showReject && (
        <div className="mt-2 space-y-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded p-2.5">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Por qual motivo?"
            className="w-full rounded text-xs border border-red-300 dark:border-red-600 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            rows={2}
          />
          <div className="flex gap-1.5">
            <button 
              onClick={() => { 
                onReject(order.id, rejectReason)
                setShowReject(false)
                setRejectReason('')
              }} 
              className="flex-1 px-2 py-1 rounded-lg text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              ✓ Recusar
            </button>
            <button 
              onClick={() => setShowReject(false)} 
              className="flex-1 px-2 py-1 rounded-lg text-xs border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function printOrder(order: Order) {
  const items = order.order_items.map((item) => {
    const dishName = item.dishes?.name['pt-BR'] || item.dishes?.name['en'] || 'Prato'
    const ingredients = item.order_item_ingredients?.map((ing) => ({
      name: ing.ingredients?.name || 'Ingrediente',
      wasAdded: ing.was_added,
    })) || []

    return {
      quantity: item.quantity,
      dishName,
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.total_price || 0),
      notes: item.notes || undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined,
    }
  })

  const total = order.order_items.reduce((s, i) => s + Number((i as any).total_price || 0), 0)

  printThermalReceipt({
    orderNumber: order.order_number,
    tableNumber: order.tables?.table_number || 'N/A',
    createdAt: order.created_at,
    items,
    totalAmount: total,
    customerName: order.customer_name || undefined,
  })
}
