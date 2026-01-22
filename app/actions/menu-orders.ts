'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitMenuOrder(data: {
  restaurantId: string
  tableId?: string
  items: {
    dishId: string
    dishName: string
    basePrice: number
    finalPrice: number
    quantity?: number
    ingredients: Record<string, number>
    dishIngredients: any[]
  }[]
  totalPrice: number
  customerName?: string
  notes?: string
}) {
  try {
    console.log('🔧 Iniciando criação de pedido...', data)
    
    const supabase = createAdminClient()
    console.log('✅ Cliente Supabase criado com sucesso')

    // Get the table ID
    let tableId: string

    if (data.tableId) {
      // Use the provided table ID from QR code
      tableId = data.tableId
      console.log('✅ Usando mesa do QR code:', tableId)
    } else {
      // Try to get the first table from the restaurant (fallback for direct orders)
      console.log('📍 Procurando mesa para restaurante:', data.restaurantId)
      const { data: tables, error: tablesError } = await (supabase as any)
        .from('tables')
        .select('id')
        .eq('restaurant_id', data.restaurantId)
        .limit(1)

      console.log('📍 Resultado da busca de mesa:', { tables, tablesError })

      if (tables && tables.length > 0) {
        tableId = tables[0].id
        console.log('✅ Mesa encontrada:', tableId)
      } else {
        // Create a temporary table for this order if none exists
        console.log('🆕 Criando mesa temporária...')
        const { data: newTable, error: tableError } = await (supabase as any)
          .from('tables')
          .insert({
            restaurant_id: data.restaurantId,
            table_number: 'Balcão/Delivery',
            is_active: true,
          })
          .select('id')
          .single()

        console.log('🆕 Mesa temporária:', { newTable, tableError })

        if (tableError || !newTable) throw tableError

        tableId = newTable.id
        console.log('✅ Mesa temporária criada:', tableId)
      }
    }

    // Create order
    console.log('📝 Criando pedido com dados:', {
      restaurant_id: data.restaurantId,
      table_id: tableId,
      customer_name: data.customerName || 'Cliente Online',
      total_amount: data.totalPrice,
    })

    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        restaurant_id: data.restaurantId,
        table_id: tableId,
        customer_name: data.customerName || 'Cliente Online',
        total_amount: data.totalPrice,
        notes: data.notes,
        status: 'pending',
      })
      .select()
      .single()

    console.log('📝 Resposta do pedido:', { order, orderError })

    if (orderError || !order) throw orderError

    console.log('✅ Pedido criado com ID:', order.id)

    // Create order items with customizations
    for (const item of data.items) {
      console.log('🍽️ Criando item de pedido:', {
        dish_id: item.dishId,
        quantity: item.quantity || 1,
        unit_price: item.finalPrice,
      })

      const { data: orderItem, error: itemError } = await (supabase as any)
        .from('order_items')
        .insert({
          order_id: order.id,
          dish_id: item.dishId,
          quantity: item.quantity || 1,
          unit_price: item.finalPrice,
          total_price: item.finalPrice * (item.quantity || 1),
        })
        .select()
        .single()

      console.log('🍽️ Item criado:', { orderItem, itemError })

      if (itemError || !orderItem) throw itemError

      // Process ingredient customizations
      const ingredientInserts: any[] = []

      // Get the default ingredients for this dish
      const defaultIngredientIds = new Set(
        item.dishIngredients
          .filter((ing: any) => ing.is_included_by_default)
          .map((ing: any) => ing.ingredient_id)
      )

      console.log('📊 Processando ingredientes:', {
        dishName: item.dishName,
        selectedIngredients: item.ingredients,
        defaultIngredients: Array.from(defaultIngredientIds),
      })

      // Track which ingredients are customized
      for (const [ingredientId, quantity] of Object.entries(item.ingredients)) {
        const qty = Number(quantity)
        
        console.log(`  - Ingrediente ${ingredientId}: qty=${qty}`)
        
        // Só salva se foi ADICIONADO (qty > 0)
        if (qty > 0) {
          const ingredientData = item.dishIngredients.find((ing: any) => ing.ingredient_id === ingredientId)
          ingredientInserts.push({
            order_item_id: orderItem.id,
            ingredient_id: ingredientId,
            was_added: true,
            price: ingredientData?.additional_price || 0,
          })
          console.log(`    ✅ ADICIONOU ingrediente`)
        }
      }

      // Save all ingredient customizations
      if (ingredientInserts.length > 0) {
        console.log('🥘 Inserindo ingredientes customizados:', ingredientInserts)
        const { error: ingError } = await (supabase as any)
          .from('order_item_ingredients')
          .insert(ingredientInserts)

        console.log('🥘 Resposta ingredientes:', ingError)

        if (ingError) throw ingError
      }
    }

    // Create status history
    console.log('📜 Criando histórico de status...')
    await (supabase as any).from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
    })

    // 🔔 CRIAR NOTIFICAÇÃO PARA A COZINHA
    console.log('🔔 Criando notificação para cozinha...')
    const kitchenNotifMsg = `Novo pedido #${order.order_number} recebido!`
    const { data: notifData, error: notifError } = await (supabase as any)
      .from('notifications')
      .insert({
        restaurant_id: data.restaurantId,
        table_id: tableId,
        order_id: order.id,
        target: 'kitchen',
        type: 'new_order',
        message: kitchenNotifMsg,
      })
      .select()

    if (notifError) {
      console.error('❌ Erro ao criar notificação para cozinha:', notifError)
    } else {
      console.log('✅ Notificação criada para cozinha:', notifData)
    }

    revalidatePath('/dashboard/kitchen')

    console.log('✅ Pedido criado com sucesso!')
    return { success: true, data: order }
  } catch (error) {
    console.error('❌ Error creating menu order:', error)
    
    // Get detailed error message
    let errorMessage = 'Failed to create order'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      const err = error as any
      errorMessage = err.message || err.error_description || JSON.stringify(error)
    }
    
    console.error('📝 Erro detalhado:', errorMessage)
    return { success: false, error: errorMessage }
  }
}
