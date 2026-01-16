import { getRestaurantByOwner } from '@/app/actions/categories'
import { getWaiterNotifications } from '@/app/actions/notifications'
import WaiterClient from './WaiterClient'

export default async function WaiterPage() {
  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  const notifications = await getWaiterNotifications((restaurant as any).id)

  return (
    <WaiterClient notifications={notifications as any[]} restaurantId={(restaurant as any).id} />
  )
}
