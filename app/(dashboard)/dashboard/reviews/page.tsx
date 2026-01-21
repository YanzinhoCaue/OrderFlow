import { getRestaurantByOwner } from '@/app/actions/categories'
import { getReviewMetrics, getRecentReviews } from '@/app/actions/reviews'
import { cookies } from 'next/headers'
import { getDictionary, translate } from '@/lib/i18n/server'
import ReviewsClient from './ReviewsClient'

export default async function ReviewsPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as any) || 'pt-BR'
  const dict = await getDictionary(locale)
  const t = (key: string) => translate(dict, key)

  const restaurant = await getRestaurantByOwner()

  if (!restaurant) {
    return <div>{t('common.error')}</div>
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
      labels={{
        title: t('dashboardReviews.title'),
        heading: t('dashboardReviews.heading'),
        subtitle: t('dashboardReviews.subtitle'),
        noReviews: t('dashboardReviews.noReviews'),
        noReviewsDescription: t('dashboardReviews.noReviewsDescription'),
        rating: t('dashboardReviews.rating'),
        dish: t('dashboardReviews.dish'),
        waiter: t('dashboardReviews.waiter'),
        restaurant: t('dashboardReviews.restaurant'),
        comment: t('dashboardReviews.comment'),
        all: t('dashboardReviews.all'),
        searchPlaceholder: t('dashboardReviews.searchPlaceholder'),
      }}
    />
  )
}
