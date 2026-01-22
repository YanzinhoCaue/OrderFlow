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
      personalInfo: t('dashboardSettings.personalInfo'),
      ownerName: t('dashboardSettings.ownerName'),
      ownerPhone: t('dashboardSettings.ownerPhone'),
      cpfCnpj: t('dashboardSettings.cpfCnpj'),
      restaurantInfo: t('dashboardSettings.restaurantInfo'),
      restaurantName: t('dashboardSettings.restaurantName'),
      restaurantPhone: t('dashboardSettings.restaurantPhone'),
      description: t('dashboardSettings.description'),
      branding: t('dashboardSettings.branding'),
      logo: t('dashboardSettings.logo'),
      cover: t('dashboardSettings.cover'),
      themeColor: t('dashboardSettings.themeColor'),
      businessHours: t('dashboardSettings.businessHours'),
      monday: t('common.monday'),
      tuesday: t('common.tuesday'),
      wednesday: t('common.wednesday'),
      thursday: t('common.thursday'),
      friday: t('common.friday'),
      saturday: t('common.saturday'),
      sunday: t('common.sunday'),
      openTime: t('dashboardSettings.openTime'),
      closeTime: t('dashboardSettings.closeTime'),
      closed: t('dashboardSettings.closed'),
      socialMedia: t('dashboardSettings.socialMedia'),
      instagram: t('dashboardSettings.instagram'),
      facebook: t('dashboardSettings.facebook'),
      whatsapp: t('dashboardSettings.whatsapp'),
      twitter: t('dashboardSettings.twitter'),
      tiktok: t('dashboardSettings.tiktok'),
      paymentMethods: t('dashboardSettings.paymentMethods'),
      acceptsCash: t('dashboardSettings.acceptsCash'),
      serviceFee: t('dashboardSettings.serviceFee'),
      pixKey: t('dashboardSettings.pixKey'),
      save: t('dashboardSettings.save'),
      saving: t('dashboardSettings.saving'),
      saveChanges: t('dashboardSettings.saveChanges'),
      success: t('dashboardSettings.success'),
      error: t('dashboardSettings.error'),
    }}
  />
}
