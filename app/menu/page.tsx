import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MenuPageClient from '@/components/menu/MenuPageClient'
import { Database } from '@/lib/supabase/types'

const normalizeField = (field: any) => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field['pt-BR'] || field['en'] || ''
  }
  return ''
}

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect('/qr')
  }

  // Pega um restaurante ativo para exibição
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(1)
    .single()

  if (restaurantError || !restaurant) {
    console.error('Error fetching restaurant:', restaurantError)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Nenhum restaurante ativo</h1>
          <p className="text-stone-600 mt-2">Tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

  type RestaurantRow = Database['public']['Tables']['restaurants']['Row']
  const restaurantData = restaurant as RestaurantRow

  const normalizedRestaurant = {
    ...(restaurantData as Record<string, any>),
    name: normalizeField(restaurantData.name),
    description: normalizeField(restaurantData.description),
    restaurant_phone: restaurantData.phone || null,
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantData.id)

  const normalizedCategories = (categories || []).map((cat) => ({
    ...cat,
    name: normalizeField(cat.name),
  }))

  let allDishes: any[] = []
  if (normalizedCategories && normalizedCategories.length > 0) {
    const { data: dishes } = await supabase
      .from('dishes')
      .select('*, dish_images(*), dish_ingredients(*, ingredients(*))')
      .eq('restaurant_id', restaurantData.id)
      .eq('is_available', true)

    allDishes = (dishes || []).map((dish) => {
      const primaryImage = dish.dish_images?.find((img: any) => img.is_primary)?.image_url || dish.dish_images?.[0]?.image_url || null
      const ingredientsList = (dish.dish_ingredients || [])
        .map((di: any) => normalizeField(di.ingredients?.name))
        .filter(Boolean)
        .join(', ')

      // Normalizar nomes dos ingredientes
      const normalizedDishIngredients = (dish.dish_ingredients || []).map((di: any) => ({
        ...di,
        ingredients: di.ingredients ? {
          ...di.ingredients,
          name: normalizeField(di.ingredients.name)
        } : null
      }))

      return {
        ...dish,
        name: normalizeField(dish.name),
        description: normalizeField(dish.description),
        primary_image: primaryImage,
        ingredients_list: ingredientsList,
        dish_ingredients: normalizedDishIngredients,
      }
    })
  }

  return (
    <MenuPageClient
      user={user}
      restaurant={normalizedRestaurant}
      categories={normalizedCategories}
      dishes={allDishes}
    />
  )
}
