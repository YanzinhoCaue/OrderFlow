import { createClient } from '@/lib/supabase/server'
import { getRestaurantByOwner } from '@/app/actions/categories'
import { getTables } from '@/app/actions/tables'
import { cookies } from 'next/headers'
import { getDictionary, translate } from '@/lib/i18n/server'
import Link from 'next/link'
import { FiPlus, FiDownload, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import NewTableModal from '@/components/dashboard/NewTableModal'
import EditTableModal from '@/components/dashboard/EditTableModal'
import TablesClient from './TablesClient'

export default async function TablesPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as any) || 'pt-BR'
  const dict = await getDictionary(locale)
  const t = (key: string) => translate(dict, key)

  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>{t('common.error')}</div>
  }

  const tables = await getTables((restaurant as any).id)

  return (
    <TablesClient 
      tables={tables as any[]} 
      restaurantId={(restaurant as any).id}
      labels={{
        title: t('dashboardTables.title'),
        heading: t('dashboardTables.heading'),
        subtitle: t('dashboardTables.subtitle'),
        addTable: t('dashboardTables.addTable'),
        newQR: t('dashboardTables.newQR'),
        downloadQR: t('dashboardTables.downloadQR'),
        previewQR: t('dashboardTables.previewQR'),
        generating: t('dashboardTables.generating'),
        regenerateQR: t('dashboardTables.regenerateQR'),
        noTables: t('dashboardTables.noTables'),
      }}
    />
  )
}
