'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus, acceptOrder, refuseOrder, markOrderReady } from '@/app/actions/orders'
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order-status'
import { formatDateTime } from '@/lib/utils/date'
import Button from '@/components/ui/Button'
import { FiClock, FiCheck } from 'react-icons/fi'

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
    dishes: { name: any }
    notes: string | null
  }[]
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (table_number),
          order_items (
            *,
            dishes (name)
          )
        `)
        .in('status', ['pending', 'received', 'in_preparation'])
        .order('created_at', { ascending: true })

      if (error) throw error
      setOrders(data as Order[])
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
    if (!reason?.trim()) return
    await refuseOrder(orderId, reason.trim())
    loadOrders()
  }

  const handleReady = async (orderId: string) => {
    await markOrderReady(orderId)
    loadOrders()
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'received'
      case 'received':
        return 'in_preparation'
      case 'in_preparation':
        return 'ready'
      default:
        return null
    }
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const receivedOrders = orders.filter((o) => o.status === 'received')
  const inPreparationOrders = orders.filter((o) => o.status === 'in_preparation')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cozinha
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie os pedidos em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-t-lg p-4 border-b-2 border-yellow-500">
            <h2 className="font-bold text-yellow-900 dark:text-yellow-300">
              Novos Pedidos ({pendingOrders.length})
            </h2>
          </div>
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg min-h-[400px]">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onAccept={handleAccept}
                onReject={handleReject}
                onReady={handleReady}
                getNextStatus={getNextStatus}
              />
            ))}
          </div>
        </div>

        {/* Received Column */}
        <div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-t-lg p-4 border-b-2 border-blue-500">
            <h2 className="font-bold text-blue-900 dark:text-blue-300">
              Recebidos ({receivedOrders.length})
            </h2>
          </div>
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg min-h-[400px]">
            {receivedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onAccept={handleAccept}
                onReject={handleReject}
                onReady={handleReady}
                getNextStatus={getNextStatus}
              />
            ))}
          </div>
        </div>

        {/* In Preparation Column */}
        <div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-t-lg p-4 border-b-2 border-orange-500">
            <h2 className="font-bold text-orange-900 dark:text-orange-300">
              Em Preparação ({inPreparationOrders.length})
            </h2>
          </div>
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg min-h-[400px]">
            {inPreparationOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onAccept={handleAccept}
                onReject={handleReject}
                onReady={handleReady}
                getNextStatus={getNextStatus}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({
  order,
  onStatusChange,
  onAccept,
  onReject,
  onReady,
  getNextStatus,
}: {
  order: Order
  onStatusChange: (orderId: string, status: any) => void
  onAccept: (orderId: string, prepTime: 15 | 30 | 60 | 90) => void
  onReject: (orderId: string, reason: string) => void
  onReady: (orderId: string) => void
  getNextStatus: (status: string) => string | null
}) {
  const [prepTime, setPrepTime] = useState<15 | 30 | 60 | 90>(30)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const nextStatus = getNextStatus(order.status)
  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-primary">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Pedido #{order.order_number}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mesa {order.tables.table_number}
          </p>
          {order.customer_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {order.customer_name}
            </p>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FiClock className="mr-1" />
          {new Date(order.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.order_items.map((item) => (
          <div key={item.id} className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                {item.quantity}x {item.dishes.name['pt-BR'] || item.dishes.name['en']}
              </span>
            </div>
            {item.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {order.status === 'pending' && (
          <>
            <select
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value) as 15 | 30 | 60 | 90)}
              className="px-3 py-2 rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-sm"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
              <option value={90}>90 minutos</option>
            </select>
            <Button onClick={() => onAccept(order.id, prepTime)} size="sm" className="bg-emerald-600 text-white">
              Aceitar
            </Button>
            <Button onClick={() => setShowReject(true)} size="sm" variant="outline" className="border-red-300 text-red-700">
              Recusar
            </Button>
          </>
        )}
        {order.status === 'received' && (
          <Button onClick={() => onStatusChange(order.id, 'in_preparation')} size="sm" className="bg-amber-600 text-white">
            Iniciar preparo
          </Button>
        )}
        {order.status === 'in_preparation' && (
          <Button onClick={() => onReady(order.id)} size="sm" className="bg-emerald-600 text-white">
            Finalizar pedido
          </Button>
        )}
        <Button onClick={() => printOrder(order)} size="sm" variant="outline" className="border-amber-300 text-amber-700">
          Imprimir
        </Button>
      </div>

      {showReject && (
        <div className="mt-3 space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Informe o motivo da recusa"
            className="w-full rounded-lg border border-red-300 bg-red-50/50 dark:bg-red-900/20 p-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={() => { onReject(order.id, rejectReason); setShowReject(false); setRejectReason('') }} size="sm" className="bg-red-600 text-white">
              Confirmar recusa
            </Button>
            <Button onClick={() => setShowReject(false)} size="sm" variant="outline" className="border-stone-300">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function printOrder(order: Order) {
  const win = window.open('', '_blank')
  if (!win) return
  const itemsHtml = order.order_items.map((item) => `
    <div style="display:flex;justify-content:space-between;font-size:14px;margin:4px 0;">
      <span>${item.quantity}x ${item.dishes?.name['pt-BR'] || item.dishes?.name['en']}</span>
      <span><strong>R$ ${(Number((item as any).total_price || 0)).toFixed(2)}</strong></span>
    </div>
  `).join('')
  const total = order.order_items.reduce((s, i) => s + Number((i as any).total_price || 0), 0)
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pedido #${order.order_number}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; }
          h1 { margin: 0 0 8px; }
          .muted { color: #57534e; font-size: 12px; }
          .card { border: 1px solid #eab308; border-radius: 12px; padding: 16px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <h1>Pedido #${order.order_number}</h1>
        <div class="muted">Mesa ${order.tables?.table_number} • ${new Date(order.created_at).toLocaleString('pt-BR')}</div>
        <div class="card">
          ${itemsHtml}
          <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:8px;">
            <span>Total</span>
            <span><strong>R$ ${total.toFixed(2)}</strong></span>
          </div>
        </div>
      </body>
    </html>
  `)
  win.document.close()
  setTimeout(() => win.print(), 250)
}
