'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'

/**
 * Get all tables for a restaurant
 */
export async function getTables(restaurantId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('table_number', { ascending: true })

  if (error) {
    console.error('Error fetching tables:', error)
    return []
  }

  return data
}

/**
 * Create a new table with optional QR code
 */
export async function createTable(data: {
  restaurantId: string
  tableNumber: string
  description?: string
  imageUrl?: string
  seatsCount: number
  isActive: boolean
}) {
  try {
    const supabase = await createClient()

    // Create table
    const { data: table, error: tableError } = await (supabase as any)
      .from('tables')
      .insert({
        restaurant_id: data.restaurantId,
        table_number: data.tableNumber,
        description: data.description,
        image_url: data.imageUrl,
        seats_count: data.seatsCount,
        is_active: data.isActive,
      })
      .select()
      .single()

    if (tableError) {
      throw tableError
    }

    revalidatePath('/dashboard/tables')
    return { success: true, data: table }
  } catch (error) {
    console.error('Error creating table:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Falha ao criar a mesa' }
  }
}

/**
 * Generate QR code for a table
 */
export async function generateTableQRCode(tableId: string) {
  try {
    const supabase = await createClient()

    // Generate a new token for the QR code (invalidates old links)
    const newToken = crypto.randomUUID()

    // Get table and restaurant info
    const { data: table, error: tableError } = await (supabase as any)
      .from('tables')
      .select('*, restaurants(slug)')
      .eq('id', tableId)
      .single()

    if (tableError) throw tableError
    if (!table) throw new Error('Table not found')

    // Get base URL from environment or use production domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imenuflow.krin.tech'

    // Generate QR code URL - points to the menu with table token (new token)
    const menuUrl = `${baseUrl}/menu/${(table.restaurants as any).slug}/${newToken}`

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Convert base64 to blob for upload
    const base64Data = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })
    const file = new File([blob], `qr-${table.id}.png`, { type: 'image/png' })

    // Upload QR code to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(`${table.restaurant_id}/${table.id}.png`, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(uploadData.path)

    // Update table with new QR code URL and new token
    const { error: updateError } = await (supabase as any)
      .from('tables')
      .update({ 
        qr_code_url: publicUrl,
        qr_code_token: newToken
      })
      .eq('id', table.id)

    if (updateError) throw updateError

    revalidatePath('/dashboard/tables')
    return { success: true, qrCodeUrl: publicUrl }
  } catch (error) {
    console.error('Error generating QR code:', error)
    return { success: false, error: 'Falha ao gerar QR Code' }
  }
}

/**
 * Update table
 */
export async function updateTable(data: {
  tableId: string
  tableNumber: string
  description?: string
  imageUrl?: string
  seatsCount: number
  isActive: boolean
}) {
  try {
    const supabase = await createClient()

    const { data: table, error } = await (supabase as any)
      .from('tables')
      .update({
        table_number: data.tableNumber,
        description: data.description,
        image_url: data.imageUrl,
        seats_count: data.seatsCount,
        is_active: data.isActive,
      })
      .eq('id', data.tableId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/tables')
    return { success: true, data: table }
  } catch (error) {
    console.error('Error updating table:', error)
    return { success: false, error: 'Falha ao atualizar a mesa' }
  }
}

/**
 * Delete table
 */
export async function deleteTable(tableId: string) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('tables')
      .delete()
      .eq('id', tableId)

    if (error) throw error

    revalidatePath('/dashboard/tables')
    return { success: true }
  } catch (error) {
    console.error('Error deleting table:', error)
    return { success: false, error: 'Failed to delete table' }
  }
}
