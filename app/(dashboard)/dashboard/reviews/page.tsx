import { getRestaurantByOwner } from '@/app/actions/categories'
import { getReviewMetrics, getRecentReviews } from '@/app/actions/reviews'
import ReviewsClient from './ReviewsClient'

export default async function ReviewsPage() {
  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>Restaurant not found</div>
  }

  const [metrics, recent] = await Promise.all([
    getReviewMetrics((restaurant as any).id),
    getRecentReviews((restaurant as any).id),
  ])

  return (
    <ReviewsClient
      restaurantId={(restaurant as any).id}
      metrics={metrics as any}
      reviews={recent as any[]}
    />
  )
}
