import { createClient } from '@/lib/supabase/server'
import PreviewClient from '@/components/dashboard/PreviewClient'

export default async function PreviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('cpf_cnpj, phone')
    .eq('id', user.id)
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) {
    return <div>Restaurante não encontrado</div>
  }

  // Normalize restaurant fields (handle multilingual objects)
  const normalizeField = (field: any): string => {
    if (typeof field === 'string') return field
    if (typeof field === 'object' && field !== null) {
      return field['pt-BR'] || field['en'] || ''
    }
    return ''
  }

  const normalizedRestaurant = {
    ...restaurant,
    name: normalizeField(restaurant.name),
    description: normalizeField(restaurant.description),
    cpf_cnpj: profile?.cpf_cnpj || null,
    restaurant_phone: restaurant.phone || profile?.phone || null,
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)

  // Normalize categories
  const normalizedCategories = (categories || []).map((cat) => ({
    ...cat,
    name: normalizeField(cat.name),
  }))

  // Fetch dishes for each category
  let allDishes: any[] = []
  if (normalizedCategories && normalizedCategories.length > 0) {
    const { data: dishes } = await supabase
      .from('dishes')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)

    allDishes = (dishes || []).map((dish) => ({
      ...dish,
      name: normalizeField(dish.name),
      description: normalizeField(dish.description),
    }))
  }

  return <PreviewClient restaurant={normalizedRestaurant} categories={normalizedCategories} dishes={allDishes} />
}
