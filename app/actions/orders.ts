'use server'

import { createClient } from '@/lib/supabase/server'
import { OrderStatus } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'

/**
 * Get all orders for a restaurant
 */
export async function getOrders(restaurantId: string, status?: OrderStatus) {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`
      *,
      tables (table_number),
      order_items (
        *,
        dishes (name),
        order_item_ingredients (
          *,
          ingredients (name)
        )
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data
}

/**
 * Create a new order
 */
export async function createOrder(data: {
  restaurantId: string
  tableId: string
  customerName?: string
  items: {
    dishId: string
    quantity: number
    unitPrice: number
    notes?: string
    addedIngredients?: string[]
    removedIngredients?: string[]
  }[]
  notes?: string
}) {
  try {
    const supabase = await createClient()

    // Calculate total
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: data.restaurantId,
        table_id: data.tableId,
        customer_name: data.customerName,
        total_amount: totalAmount,
        notes: data.notes,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    for (const item of data.items) {
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          dish_id: item.dishId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity,
          notes: item.notes,
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Add customizations if any
      if (item.addedIngredients && item.addedIngredients.length > 0) {
        const addedInserts = item.addedIngredients.map((ingredientId) => ({
          order_item_id: orderItem.id,
          ingredient_id: ingredientId,
          was_added: true,
        }))

        await supabase.from('order_item_ingredients').insert(addedInserts)
      }

      if (item.removedIngredients && item.removedIngredients.length > 0) {
        const removedInserts = item.removedIngredients.map((ingredientId) => ({
          order_item_id: orderItem.id,
          ingredient_id: ingredientId,
          was_added: false,
        }))

        await supabase.from('order_item_ingredients').insert(removedInserts)
      }
    }

    // Create status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
    })

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/kitchen')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Failed to create order' }
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    // Update order
    const { data, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) throw updateError

    // Add to status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status,
      changed_by: user?.id,
    })

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/waiter')
    return { success: true, data }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

/**
 * Accept order with a selected prep time and notify customer/waiter
 */
export async function acceptOrder(orderId: string, prepTimeMinutes: 15 | 30 | 60 | 90) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    // Update order to received and set prep time
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'received', prep_time_minutes: prepTimeMinutes })
      .eq('id', orderId)
      .select('*, tables(table_number), restaurants(id)')
      .single()

    if (updateError) throw updateError

    // Status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'received',
      changed_by: user?.id,
      notes: `Tempo de preparo: ${prepTimeMinutes} minutos`,
    })

    // Notifications
    const customerMsg = `Seu pedido #${order.order_number} foi aceito. Tempo de preparo: ${prepTimeMinutes} minutos.`
    const waiterMsg = `Pedido #${order.order_number} (Mesa ${order.tables?.table_number}) aceito. Preparo: ${prepTimeMinutes}m.`

    await supabase.from('notifications').insert([
      {
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        target: 'customer',
        type: 'accepted',
        message: customerMsg,
      },
      {
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        target: 'waiter',
        type: 'accepted',
        message: waiterMsg,
      },
    ])

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/waiter')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error accepting order:', error)
    return { success: false, error: 'Failed to accept order' }
  }
}

/**
 * Refuse order with reason and notify customer/waiter
 */
export async function refuseOrder(orderId: string, reason: string) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select('*, tables(table_number), restaurants(id)')
      .single()

    if (updateError) throw updateError

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'cancelled',
      changed_by: user?.id,
      notes: reason,
    })

    const customerMsg = `Seu pedido #${order.order_number} foi recusado: ${reason}`
    const waiterMsg = `Pedido #${order.order_number} (Mesa ${order.tables?.table_number}) recusado: ${reason}`

    await supabase.from('notifications').insert([
      {
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        target: 'customer',
        type: 'cancelled',
        message: customerMsg,
      },
      {
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        target: 'waiter',
        type: 'cancelled',
        message: waiterMsg,
      },
    ])

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/waiter')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error refusing order:', error)
    return { success: false, error: 'Failed to refuse order' }
  }
}

/**
 * Mark order as ready and notify waiter/customer
 */
export async function markOrderReady(orderId: string) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'ready' })
      .eq('id', orderId)
      .select('*, tables(table_number), restaurants(id)')
      .single()

    if (updateError) throw updateError

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'ready',
      changed_by: user?.id,
      notes: 'Pedido pronto para entrega',
    })

    const customerMsg = `Seu pedido #${order.order_number} está pronto!`
    const waiterMsg = `Pedido #${order.order_number} (Mesa ${order.tables?.table_number}) pronto para servir.`

    await supabase.from('notifications').insert([
      {
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        target: 'customer',
        type: 'ready',
        message: customerMsg,
      },
      {
        restaurant_id: order.restaurant_id,
        table_id: order.table_id,
        order_id: order.id,
        target: 'waiter',
        type: 'ready',
        message: waiterMsg,
      },
    ])

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/waiter')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error marking order ready:', error)
    return { success: false, error: 'Failed to mark order ready' }
  }
}
