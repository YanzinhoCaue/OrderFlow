import { getRestaurantByOwner } from '@/app/actions/categories'
import { getOrders } from '@/app/actions/orders'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  const orders = await getOrders((restaurant as any).id)

  return (
    <OrdersClient orders={orders as any[]} restaurantId={(restaurant as any).id} />
  )
}
