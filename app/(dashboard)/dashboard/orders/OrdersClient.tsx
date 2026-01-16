"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { FiClock, FiUser, FiXCircle, FiArrowRight, FiSearch } from 'react-icons/fi'
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order-status'
import { getRelativeTime } from '@/lib/utils/date'
import { updateOrderStatus } from '@/app/actions/orders'
import Button from '@/components/ui/Button'
import OrderDetailsModal from '@/components/dashboard/OrderDetailsModal'
import { OrderStatus } from '@/lib/supabase/types'

interface OrderItemIngredient {
  id: string
  was_added: boolean
  ingredients: {
    name: string
  }
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number | string
  total_price: number | string
  notes?: string | null
  dishes: { name: string }
  order_item_ingredients?: OrderItemIngredient[]
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

interface OrdersClientProps {
  orders: Order[]
  restaurantId: string
}

type StatusFilter = 'all' | OrderStatus

const STATUS_FLOW: Order['status'][] = ['pending', 'received', 'in_preparation', 'ready', 'delivered']

export default function OrdersClient({ orders, restaurantId: _restaurantId }: OrdersClientProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [orderList, setOrderList] = useState<Order[]>(orders)

  useEffect(() => {
    setOrderList(orders)
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orderList.filter((order) => {
      const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter

      const matchesSearch = !query
        ? true
        : (
            `#${order.order_number}`.toLowerCase().includes(query) ||
            order.tables?.table_number?.toLowerCase().includes(query) ||
            (order.customer_name || '').toLowerCase().includes(query) ||
            order.order_items.some((item) => item.dishes?.name?.toLowerCase().includes(query))
          )

      return matchesStatus && matchesSearch
    })
  }, [orderList, search, statusFilter])

  const groupedStats = useMemo(() => {
    return orderList.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<Order['status'], number>
    )
  }, [orderList])

  const handleStatusChange = (orderId: string, currentStatus: Order['status'], nextStatus?: Order['status']) => {
    if (!nextStatus) return
    setUpdatingId(orderId)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus)
      if (result?.success) {
        setOrderList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        )
      }
      setUpdatingId(null)
    })
  }

  const getNextStatus = (status: Order['status']): Order['status'] | undefined => {
    const idx = STATUS_FLOW.indexOf(status)
    if (idx === -1) return undefined
    return STATUS_FLOW[idx + 1]
  }

  const summaryCards = [
    { key: 'all', label: 'Todos', value: orders.length, color: 'from-amber-500 to-orange-500' },
    { key: 'pending', label: 'Novos', value: groupedStats['pending'] || 0, color: 'from-amber-400 to-yellow-400' },
    { key: 'received', label: 'Recebidos', value: groupedStats['received'] || 0, color: 'from-blue-500 to-cyan-500' },
    { key: 'in_preparation', label: 'Em preparo', value: groupedStats['in_preparation'] || 0, color: 'from-orange-500 to-amber-600' },
    { key: 'ready', label: 'Prontos', value: groupedStats['ready'] || 0, color: 'from-emerald-500 to-green-500' },
    { key: 'delivered', label: 'Entregues', value: groupedStats['delivered'] || 0, color: 'from-purple-500 to-indigo-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">Operação</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            Pedidos
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            Acompanhe, filtre e avance o status dos pedidos
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setStatusFilter(card.key as StatusFilter)}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
              statusFilter === card.key ? 'border-amber-500 shadow-amber-500/30 shadow-lg' : 'border-amber-500/20'
            } bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg text-left px-4 py-3`}
          >
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${card.color}`} />
            <div className="relative">
              <p className="text-xs text-stone-500 dark:text-stone-400">{card.label}</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-white">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros e busca */}
      <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mesa, cliente ou prato..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all','pending','received','in_preparation','ready','delivered','cancelled'] as StatusFilter[]).map((status) => {
              const config = ORDER_STATUS_CONFIG[status as Order['status']]
              const isActive = statusFilter === status
              const labelMap: Record<StatusFilter, string> = {
                all: 'Todos',
                pending: 'Novo',
                received: 'Recebido',
                in_preparation: 'Em preparo',
                ready: 'Pronto',
                delivered: 'Entregue',
                cancelled: 'Cancelado',
              }
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200 shadow-sm'
                      : 'border-amber-500/30 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {labelMap[status] || config?.label || status}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">Nenhum pedido encontrado</h3>
          <p className="text-stone-600 dark:text-stone-400">Tente outro termo ou ajuste os filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const config = ORDER_STATUS_CONFIG[order.status]
            const nextStatus = getNextStatus(order.status)
            const total = Number(order.total_amount || 0)

            return (
              <OrderDetailsModal
                key={order.id}
                order={order}
                onStatusChange={(status) => handleStatusChange(order.id, order.status, status)}
                currentUpdating={updatingId === order.id && isPending}
              >
                <div className="group bg-white/90 dark:bg-white/5 border-2 border-amber-500/15 rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl overflow-hidden cursor-pointer">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Pedido</span>
                          <span className="text-lg font-bold text-stone-900 dark:text-white">#{order.order_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                          <FiClock />
                          <span>{getRelativeTime(order.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                          <FiUser />
                          <span>
                            Mesa {order.tables?.table_number}
                            {order.customer_name ? ` • ${order.customer_name}` : ''}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                        order.status === 'cancelled'
                          ? 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30'
                          : 'bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30'
                      }`}>
                        {config?.label || order.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.order_items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-start justify-between text-sm text-stone-700 dark:text-stone-300">
                          <span className="line-clamp-1">{item.quantity}x {item.dishes?.name}</span>
                          <span className="font-semibold">R$ {(Number(item.total_price)).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <p className="text-xs text-stone-500">+ {order.order_items.length - 3} itens</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-amber-500/15">
                      <div className="text-sm text-stone-600 dark:text-stone-300">Total</div>
                      <div className="text-lg font-bold text-stone-900 dark:text-white">R$ {total.toFixed(2)}</div>
                    </div>

                    <div className="flex gap-2">
                      {nextStatus && order.status !== 'cancelled' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(order.id, order.status, nextStatus)
                          }}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                          disabled={updatingId === order.id && isPending}
                        >
                          <FiArrowRight className="mr-2" />
                          {updatingId === order.id && isPending ? 'Atualizando...' : 'Avançar'}
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(order.id, order.status, 'cancelled')
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 dark:text-red-200"
                          disabled={updatingId === order.id && isPending}
                        >
                          <FiXCircle className="mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </OrderDetailsModal>
            )
          })}
        </div>
      )}
    </div>
  )
}
