"use client"

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiClock, FiUser, FiCheckCircle, FiArrowRightCircle, FiXCircle, FiPrinter } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order-status'
import { getRelativeTime, formatDateTime } from '@/lib/utils/date'
import { OrderStatus } from '@/lib/supabase/types'
import { printThermalReceipt } from '@/components/print/ThermalReceiptPrint'

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

interface OrderDetailsModalProps {
  order: {
    id: string
    order_number: number
    status: OrderStatus
    total_amount: number | string
    customer_name?: string | null
    notes?: string | null
    created_at: string
    tables: { table_number: string }
    order_items: OrderItem[]
  }
  children: React.ReactNode
  onStatusChange: (status: OrderStatus) => void
  currentUpdating?: boolean
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'received', 'in_preparation', 'ready', 'delivered']

export default function OrderDetailsModal({ order, children, onStatusChange, currentUpdating }: OrderDetailsModalProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pending, startTransition] = useTransition()

  const handlePrint = () => {
    const items = order.order_items.map((item) => {
      const ingredients = item.order_item_ingredients?.map((ing) => ({
        name: ing.ingredients?.name || 'Ingrediente',
        wasAdded: ing.was_added,
      })) || []

      return {
        quantity: item.quantity,
        dishName: item.dishes?.name || 'Prato',
        unitPrice: Number(item.unit_price || 0),
        totalPrice: Number(item.total_price || 0),
        notes: item.notes || undefined,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
      }
    })

    printThermalReceipt({
      orderNumber: order.order_number,
      tableNumber: order.tables?.table_number || 'N/A',
      createdAt: order.created_at,
      items,
      totalAmount: Number(order.total_amount || 0),
      customerName: order.customer_name || undefined,
    })
  }

  useEffect(() => setMounted(true), [])

  const nextStatus = () => {
    const idx = STATUS_FLOW.indexOf(order.status)
    if (idx === -1) return undefined
    return STATUS_FLOW[idx + 1]
  }

  const handleAdvance = () => {
    const target = nextStatus()
    if (!target) return
    startTransition(() => {
      onStatusChange(target)
    })
  }

  const handleDeliver = () => {
    startTransition(() => onStatusChange('delivered'))
  }

  const handleCancel = () => {
    startTransition(() => onStatusChange('cancelled'))
  }

  if (!mounted) return children

  return (
    <>
      <div onClick={() => setOpen(true)} className="h-full">
        {children}
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400">Pedido</p>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">#{order.order_number}</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">{formatDateTime(order.created_at)}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                    <FiUser />
                    <span>Mesa {order.tables?.table_number}{order.customer_name ? ` • ${order.customer_name}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                    <FiClock />
                    <span>{getRelativeTime(order.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {order.notes && (
                <div className="bg-amber-50/70 dark:bg-amber-900/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  Observações: {order.notes}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">Itens</h3>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="border border-amber-500/15 rounded-xl p-3 bg-white/70 dark:bg-slate-900/70">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-900 dark:text-white">{item.quantity}x {item.dishes?.name}</p>
                          {item.notes && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Obs: {item.notes}</p>
                          )}
                          {item.order_item_ingredients && item.order_item_ingredients.length > 0 && (
                            <div className="mt-2 space-y-1 text-xs text-stone-600 dark:text-stone-300">
                              {item.order_item_ingredients.map((ing) => (
                                <div key={ing.id} className="flex items-center gap-2">
                                  <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold ${
                                    ing.was_added
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-red-100 text-red-700 border border-red-200'
                                  }`}>
                                    {ing.was_added ? '+' : '-'}
                                  </span>
                                  <span>{ing.ingredients?.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-stone-500 dark:text-stone-400">Unitário</p>
                          <p className="font-semibold text-stone-900 dark:text-white">R$ {Number(item.unit_price).toFixed(2)}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Total</p>
                          <p className="font-semibold text-stone-900 dark:text-white">R$ {Number(item.total_price).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-amber-500/20 pt-4">
                <span className="text-sm text-stone-600 dark:text-stone-300">Valor total</span>
                <span className="text-2xl font-bold text-stone-900 dark:text-white">R$ {Number(order.total_amount).toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {order.status !== 'cancelled' && nextStatus() && (
                  <Button
                    onClick={handleAdvance}
                    disabled={pending || currentUpdating}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  >
                    <FiArrowRightCircle className="mr-2" />
                    {pending || currentUpdating ? 'Atualizando...' : 'Avançar'}
                  </Button>
                )}
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 dark:text-amber-200"
                >
                  <FiPrinter className="mr-2" />
                  Imprimir
                </Button>
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button
                    onClick={handleDeliver}
                    variant="outline"
                    disabled={pending || currentUpdating}
                    className="w-full border-emerald-300 text-emerald-700 dark:text-emerald-200"
                  >
                    <FiCheckCircle className="mr-2" />
                    Marcar entregue
                  </Button>
                )}
                {order.status !== 'cancelled' && (
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={pending || currentUpdating}
                    className="w-full border-red-300 text-red-700 dark:text-red-200"
                  >
                    <FiXCircle className="mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status]
  const labelMap: Record<OrderStatus, string> = {
    pending: 'Novo',
    received: 'Recebido',
    in_preparation: 'Em preparo',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }

  const colors: Record<OrderStatus, string> = {
    pending: 'bg-stone-100/80 text-stone-700 border-stone-200 dark:bg-stone-500/10 dark:text-stone-200 dark:border-stone-500/30',
    received: 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/30',
    in_preparation: 'bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30',
    ready: 'bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30',
    delivered: 'bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-200 dark:border-purple-500/30',
    cancelled: 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30',
  }

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${colors[status]}`}>
      {labelMap[status] || config?.label || status}
    </span>
  )
}
