import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MenuPageClient from '@/components/menu/MenuPageClient'

const normalizeField = (field: any) => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field['pt-BR'] || field['en'] || ''
  }
  return ''
}

interface Props {
  params: Promise<{
    slug: string
    tableToken: string
  }>
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug, tableToken } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  // If not authenticated, redirect to login with return URL
  if (!user) {
    redirect(`/login?redirect=/menu/${slug}/${tableToken}`)
  }

  // Get restaurant by slug
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (restaurantError || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Restaurante não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O restaurante que você procura não está disponível
          </p>
        </div>
      </div>
    )
  }

  // Get table by token
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('qr_code_token', tableToken)
    .eq('restaurant_id', (restaurant as any).id)
    .eq('is_active', true)
    .single()

  if (tableError || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mesa não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esta mesa não está disponível ou foi desativada
          </p>
        </div>
      </div>
    )
  }

  // Get categories and dishes
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      *,
      dishes (
        *,
        dish_images (*),
        dish_ingredients (
          *,
          ingredients (*)
        )
      )
    `)
    .eq('restaurant_id', (restaurant as any).id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Normalize restaurant data
  const normalizedRestaurant = {
    ...(restaurant as Record<string, any>),
    name: normalizeField(restaurant.name),
    description: normalizeField(restaurant.description),
    restaurant_phone: restaurant.phone || null,
  }

  // Normalize categories
  const normalizedCategories = (categories || []).map((cat: any) => ({
    ...cat,
    name: normalizeField(cat.name),
    description: normalizeField(cat.description),
  }))

  // Normalize dishes
  const normalizedDishes: any[] = []
  normalizedCategories.forEach((cat: any) => {
    if (cat.dishes && Array.isArray(cat.dishes)) {
      cat.dishes.forEach((dish: any) => {
        normalizedDishes.push({
          ...dish,
          name: normalizeField(dish.name),
          description: normalizeField(dish.description),
          category_id: cat.id,
        })
      })
    }
  })

  return (
    <MenuPageClient
      user={{ user_metadata: { name: `Mesa ${(table as any).table_number}` } }}
      table={table}
      restaurant={normalizedRestaurant}
      categories={normalizedCategories}
      dishes={normalizedDishes}
    />
  )
}
