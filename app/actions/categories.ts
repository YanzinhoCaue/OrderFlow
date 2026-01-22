'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

/**
 * Get restaurant by owner
 */
export async function getRestaurantByOwner() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return null

  const { data, error } = await (supabase as any)
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching restaurant:', error)
    return null
  }

  return data
}

/**
 * Get all categories for a restaurant
 */
export async function getCategories(restaurantId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

/**
 * Create a new category
 */
export async function createCategory(
  restaurantId: string,
  name: Record<string, string>,
  description?: Record<string, string>
) {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('categories')
      .insert({
        restaurant_id: restaurantId,
        name,
        description,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Error creating category:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

/**
 * Update category
 */
export async function updateCategory(
  categoryId: string,
  name: Record<string, string>,
  description?: Record<string, string>
) {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('categories')
      .update({ name, description })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Error updating category:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

/**
 * Delete category
 */
export async function deleteCategory(categoryId: string) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}
