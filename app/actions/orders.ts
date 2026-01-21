'use server'

import { createClient } from '@/lib/supabase/server'
import { OrderStatus } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'

/**
 * Normalize multilanguage fields
 */
const normalizeField = (field: any): string => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field['pt-BR'] || field['en'] || ''
  }
  return ''
}

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

  // Normalize multilanguage fields
  const normalizedData = data?.map((order: any) => ({
    ...order,
    order_items: order.order_items?.map((item: any) => ({
      ...item,
      dishes: item.dishes ? {
        ...item.dishes,
        name: normalizeField(item.dishes.name)
      } : null,
      order_item_ingredients: item.order_item_ingredients?.map((ing: any) => ({
        ...ing,
        ingredients: ing.ingredients ? {
          ...ing.ingredients,
          name: normalizeField(ing.ingredients.name)
        } : null
      }))
    }))
  }))

  return normalizedData || []
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

    console.log('🎯 acceptOrder iniciado - orderId:', orderId, 'prepTime:', prepTimeMinutes)

    // Update order to received and set prep time
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'in_preparation' })
      .eq('id', orderId)
      .select('*, tables(table_number), restaurants(id)')
      .single()

    if (updateError) throw updateError

    console.log('📦 Pedido atualizado:', order.order_number, '- Mesa:', order.tables?.table_number)

    // Status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'in_preparation',
      changed_by: user?.id,
      notes: `Tempo de preparo: ${prepTimeMinutes} minutos`,
    })

    // Notifications
    const customerMsg = `Seu pedido #${order.order_number} foi aceito. Tempo de preparo: ${prepTimeMinutes} minutos.`
    const waiterMsg = `Pedido #${order.order_number} (Mesa ${order.tables?.table_number}) aceito. Preparo: ${prepTimeMinutes}m.`

    console.log('📤 Criando notificações...')
    console.log('   - Cliente:', customerMsg)
    console.log('   - Garçom:', waiterMsg)
    console.log('   - restaurant_id:', order.restaurant_id)
    console.log('   - table_id:', order.table_id)
    console.log('   - order_id:', order.id)

    const { data: notifData, error: notifError } = await supabase.from('notifications').insert([
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
    ]).select()

    if (notifError) {
      console.error('❌ Erro ao criar notificações:', notifError)
    } else {
      console.log('✅ Notificações criadas com sucesso:', notifData)
    }

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
  console.log('🔥 refuseOrder iniciado - orderId:', orderId, 'reason:', reason)
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()
    console.log('👤 User:', user?.id)

    console.log('🔄 Atualizando status do pedido para cancelled...')
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select('*, tables(table_number), restaurants(id)')
      .single()

    console.log('📊 Resultado da atualização:', { orderId, status: order?.status, error: updateError })
    if (updateError) throw updateError

    console.log('📝 Adicionando histórico de status...')
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'cancelled',
      changed_by: user?.id,
      notes: reason,
    })

    console.log('🔔 Criando notificações para cliente e garçom...')
    const customerMsg = `Seu pedido #${order.order_number} foi recusado: ${reason}`
    const waiterMsg = `Pedido #${order.order_number} (Mesa ${order.tables?.table_number}) recusado: ${reason}`

    console.log('   - Cliente:', customerMsg)
    console.log('   - Garçom:', waiterMsg)
    console.log('   - restaurant_id:', order.restaurant_id)
    console.log('   - table_id:', order.table_id)
    console.log('   - order_id:', order.id)

    const { data: notifData, error: notifError } = await supabase.from('notifications').insert([
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
    ]).select()

    if (notifError) {
      console.error('❌ Erro ao criar notificações de recusa:', notifError)
    } else {
      console.log('✅ Notificações de recusa criadas com sucesso:', notifData)
    }

    console.log('✅ Revalidando paths...')
    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/waiter')
    console.log('🎉 refuseOrder concluído com sucesso!')
    return { success: true, data: order }
  } catch (error) {
    console.error('💥 Erro em refuseOrder:', error, 'Tipo:', typeof error)
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

    console.log('🎯 markOrderReady iniciado - orderId:', orderId)

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'ready' })
      .eq('id', orderId)
      .select('*, tables(table_number), restaurants(id)')
      .single()

    if (updateError) throw updateError

    console.log('📦 Pedido marcado como pronto:', order.order_number)

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'ready',
      changed_by: user?.id,
      notes: 'Pedido pronto para entrega',
    })

    const customerMsg = `Seu pedido #${order.order_number} está pronto!`
    const waiterMsg = `Pedido #${order.order_number} (Mesa ${order.tables?.table_number}) pronto para servir.`

    console.log('🔔 Criando notificações de pedido pronto...')
    console.log('   - Cliente:', customerMsg)
    console.log('   - Garçom:', waiterMsg)
    console.log('   - restaurant_id:', order.restaurant_id)
    console.log('   - table_id:', order.table_id)
    console.log('   - order_id:', order.id)

    const { data: notifData, error: notifError } = await supabase.from('notifications').insert([
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
    ]).select()

    if (notifError) {
      console.error('❌ Erro ao criar notificações de pedido pronto:', notifError)
    } else {
      console.log('✅ Notificações de pedido pronto criadas com sucesso:', notifData)
    }

    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/waiter')
    return { success: true, data: order }
  } catch (error) {
    console.error('Error marking order ready:', error)
    return { success: false, error: 'Failed to mark order ready' }
  }
}

/**
 * Delete a completed order
 */
export async function deleteOrder(orderId: string) {
  try {
    const supabase = await createClient()

    // First delete order items and related data
    await supabase.from('order_item_ingredients').delete().eq('order_item_id', orderId)
    await supabase.from('order_items').delete().eq('order_id', orderId)

    // Then delete the order itself
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/dashboard/kitchen')
    return { success: true }
  } catch (error) {
    console.error('Error deleting order:', error)
    return { success: false, error: 'Failed to delete order' }
  }
}

/**
 * Reopen a cancelled order
 */
export async function reopenOrder(orderId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/dashboard/kitchen')
    return { success: true }
  } catch (error) {
    console.error('Error reopening order:', error)
    return { success: false, error: 'Failed to reopen order' }
  }
}
