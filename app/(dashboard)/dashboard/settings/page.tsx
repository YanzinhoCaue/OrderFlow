import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getDictionary, translate } from '@/lib/i18n/server'
import SettingsClient from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!profile || !restaurant) {
    return <div>{t('common.error')}</div>
  }

  return <SettingsClient 
    restaurant={restaurant as any} 
    profile={profile as any}
    labels={{
      title: t('dashboardSettings.title'),
      heading: t('dashboardSettings.heading'),
      subtitle: t('dashboardSettings.subtitle'),
      generalInfo: t('dashboardSettings.generalInfo'),
      restaurantName: t('dashboardSettings.restaurantName'),
      phone: t('dashboardSettings.phone'),
      description: t('dashboardSettings.description'),
      appearance: t('dashboardSettings.appearance'),
      selectTheme: t('dashboardSettings.selectTheme'),
      selectLanguage: t('dashboardSettings.selectLanguage'),
      save: t('dashboardSettings.save'),
      saved: t('dashboardSettings.saved'),
      error: t('dashboardSettings.error'),
    }}
  />
}
