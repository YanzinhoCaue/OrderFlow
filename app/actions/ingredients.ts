'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get all ingredients for a restaurant
 */
export async function getIngredients(restaurantId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('ingredients')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching ingredients:', error)
    return []
  }

  return data
}

/**
 * Create a new ingredient
 */
export async function createIngredient(
  restaurantId: string,
  name: Record<string, string>,
  price?: number,
  imageUrl?: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('ingredients')
      .insert({
        restaurant_id: restaurantId,
        name,
        price: price || 0,
        image_url: imageUrl || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return { success: false, error: 'Failed to create ingredient' }
  }
}

/**
 * Delete ingredient
 */
export async function deleteIngredient(ingredientId: string) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('ingredients')
      .delete()
      .eq('id', ingredientId)

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return { success: false, error: 'Failed to delete ingredient' }
  }
}

/**
 * Update ingredient
 */
export async function updateIngredient(
  ingredientId: string,
  name: Record<string, string>,
  price?: number,
  imageUrl?: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('ingredients')
      .update({
        name,
        price: price || 0,
        image_url: imageUrl || null,
      })
      .eq('id', ingredientId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Error updating ingredient:', error)
    return { success: false, error: 'Failed to update ingredient' }
  }
}
