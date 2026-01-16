'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get all dishes for a restaurant
 */
export async function getDishes(restaurantId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dishes')
    .select(`
      *,
      categories (id, name),
      dish_images (*),
      dish_ingredients (
        *,
        ingredients (*)
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching dishes:', error)
    return []
  }

  return data
}

/**
 * Get single dish with all details
 */
export async function getDish(dishId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dishes')
    .select(`
      *,
      categories (id, name),
      dish_images (*),
      dish_ingredients (
        *,
        ingredients (*)
      )
    `)
    .eq('id', dishId)
    .single()

  if (error) {
    console.error('Error fetching dish:', error)
    return null
  }

  return data
}

/**
 * Create a new dish
 */
export async function createDish(data: {
  restaurantId: string
  categoryId: string
  name: Record<string, string>
  description?: Record<string, string>
  basePrice: number
  images?: string[]
  ingredients?: Array<{
    ingredientId: string
    additionalPrice?: number
    isOptional?: boolean
    isRemovable?: boolean
    isIncludedByDefault?: boolean
  }>
  isAvailable?: boolean
  availableDays?: number[] // 0-6 (Sunday-Saturday)
}) {
  try {
    const supabase = await createClient()

    // Create dish
    const { data: dish, error: dishError} = await supabase
      .from('dishes')
      .insert({
        restaurant_id: data.restaurantId,
        category_id: data.categoryId,
        name: data.name,
        description: data.description,
        base_price: data.basePrice,
        is_available: data.isAvailable ?? true,
        available_days: data.availableDays || [0, 1, 2, 3, 4, 5, 6],
      })
      .select()
      .single()

    if (dishError) throw dishError

    if (!dish) {
      throw new Error('Falha ao criar o prato - nenhum dado retornado')
    }

    // Add images if provided
    if (data.images && data.images.length > 0) {
      const imageInserts = data.images.map((url, index) => ({
        dish_id: dish.id,
        image_url: url,
        display_order: index,
        is_primary: index === 0,
      }))

      const { error: imageError } = await supabase
        .from('dish_images')
        .insert(imageInserts)

      if (imageError) throw imageError
    }

    // Add ingredients if provided
    if (data.ingredients && data.ingredients.length > 0) {
      const ingredientInserts = data.ingredients.map((ing) => ({
        dish_id: dish.id,
        ingredient_id: ing.ingredientId,
        additional_price: ing.additionalPrice || 0,
        is_optional: ing.isOptional ?? true,
        is_removable: ing.isRemovable ?? true,
        is_included_by_default: ing.isIncludedByDefault ?? true,
      }))

      const { error: ingredientError } = await supabase
        .from('dish_ingredients')
        .insert(ingredientInserts)

      if (ingredientError) throw ingredientError
    }

    revalidatePath('/dashboard/menu')
    return { success: true, data: dish }
  } catch (error: any) {
    console.error('Error creating dish:', error)
    let errorMessage = 'Não foi possível criar o prato'
    
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.error_description) {
      errorMessage = error.error_description
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Update dish
 */
export async function updateDish(
  dishId: string,
  data: {
    name: Record<string, string>
    description?: Record<string, string>
    basePrice: number
    categoryId: string
    isAvailable?: boolean
    availableDays?: number[]
    images?: string[]
    ingredients?: Array<{
      ingredientId: string
      additionalPrice?: number
      isOptional?: boolean
      isRemovable?: boolean
      isIncludedByDefault?: boolean
    }>
  }
) {
  try {
    const supabase = await createClient()

    const { data: dish, error } = await supabase
      .from('dishes')
      .update({
        name: data.name,
        description: data.description,
        base_price: data.basePrice,
        category_id: data.categoryId,
        is_available: data.isAvailable,
        available_days: data.availableDays,
      })
      .eq('id', dishId)
      .select()
      .single()

    if (error) throw error

    // Update images if provided
    if (data.images) {
      // Remove existing images
      await supabase.from('dish_images').delete().eq('dish_id', dishId)
      
      // Add new images
      if (data.images.length > 0) {
        const imageInserts = data.images.map((url, index) => ({
          dish_id: dishId,
          image_url: url,
          display_order: index,
          is_primary: index === 0,
        }))
        await supabase.from('dish_images').insert(imageInserts)
      }
    }

    // Update ingredients if provided
    if (data.ingredients) {
      // Remove existing dish_ingredients
      await supabase.from('dish_ingredients').delete().eq('dish_id', dishId)
      
      // Add new ingredients
      if (data.ingredients.length > 0) {
        const ingredientInserts = data.ingredients.map((ing) => ({
          dish_id: dishId,
          ingredient_id: ing.ingredientId,
          additional_price: ing.additionalPrice || 0,
          is_optional: ing.isOptional ?? true,
          is_removable: ing.isRemovable ?? true,
          is_included_by_default: ing.isIncludedByDefault ?? true,
        }))
        await supabase.from('dish_ingredients').insert(ingredientInserts)
      }
    }

    revalidatePath('/dashboard/menu')
    return { success: true, data: dish }
  } catch (error: any) {
    console.error('Error updating dish:', error)
    let errorMessage = 'Não foi possível atualizar o prato'
    
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.error_description) {
      errorMessage = error.error_description
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Delete dish
 */
export async function deleteDish(dishId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId)

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting dish:', error)
    return { success: false, error: 'Failed to delete dish' }
  }
}

/**
 * Add ingredient to dish
 */
export async function addIngredientToDish(
  dishId: string,
  ingredientId: string,
  options: {
    isOptional?: boolean
    isRemovable?: boolean
    isIncludedByDefault?: boolean
    additionalPrice?: number
  }
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('dish_ingredients')
      .insert({
        dish_id: dishId,
        ingredient_id: ingredientId,
        is_optional: options.isOptional ?? true,
        is_removable: options.isRemovable ?? true,
        is_included_by_default: options.isIncludedByDefault ?? true,
        additional_price: options.additionalPrice ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Error adding ingredient to dish:', error)
    return { success: false, error: 'Failed to add ingredient' }
  }
}

/**
 * Remove ingredient from dish
 */
export async function removeIngredientFromDish(dishIngredientId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('dish_ingredients')
      .delete()
      .eq('id', dishIngredientId)

    if (error) throw error

    revalidatePath('/dashboard/menu')
    return { success: true }
  } catch (error) {
    console.error('Error removing ingredient from dish:', error)
    return { success: false, error: 'Failed to remove ingredient' }
  }
}
