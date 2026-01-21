import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getDictionary, translate } from '@/lib/i18n/server'
import PreviewClient from '@/components/dashboard/PreviewClient'

export default async function PreviewPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as any) || 'pt-BR'
  const dict = await getDictionary(locale)
  const t = (key: string) => translate(dict, key)

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
    return <div>{t('common.error')}</div>
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
    ...(restaurant as Record<string, any>),
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

  return <PreviewClient 
    restaurant={normalizedRestaurant} 
    categories={normalizedCategories} 
    dishes={allDishes}
    labels={{
      title: t('dashboardPreview.title'),
      heading: t('dashboardPreview.heading'),
      subtitle: t('dashboardPreview.subtitle'),
      selectLanguage: t('dashboardPreview.selectLanguage'),
      selectTheme: t('dashboardPreview.selectTheme'),
      previewMenu: t('dashboardPreview.previewMenu'),
      menuColor: t('dashboardPreview.menuColor'),
      lightMode: t('dashboardPreview.lightMode'),
      darkMode: t('dashboardPreview.darkMode'),
      statistics: t('dashboardPreview.statistics'),
      information: t('dashboardPreview.information'),
      payment: t('dashboardPreview.payment'),
      socialMedia: t('dashboardPreview.socialMedia'),
    }}
  />
}
