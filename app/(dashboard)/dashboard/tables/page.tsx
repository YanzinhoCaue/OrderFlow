import { createClient } from '@/lib/supabase/server'
import { getRestaurantByOwner } from '@/app/actions/categories'
import { getTables } from '@/app/actions/tables'
import Link from 'next/link'
import { FiPlus, FiDownload, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import NewTableModal from '@/components/dashboard/NewTableModal'
import EditTableModal from '@/components/dashboard/EditTableModal'
import TablesClient from './TablesClient'

export default async function TablesPage() {
  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  const tables = await getTables((restaurant as any).id)

  return (
    <TablesClient tables={tables as any[]} restaurantId={(restaurant as any).id} />
  )
}
