import { getRestaurantByOwner } from '@/app/actions/categories'
import { getReviewMetrics, getRecentReviews, getDishMetrics, getRatingDistribution } from '@/app/actions/reviews'
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

  const restaurantId = (restaurant as any).id

  const [metrics, recent, dishMetrics, ratingDist] = await Promise.all([
    getReviewMetrics(restaurantId),
    getRecentReviews(restaurantId, 50),
    getDishMetrics(restaurantId),
    Promise.all([
      getRatingDistribution(restaurantId, 'restaurant'),
      getRatingDistribution(restaurantId, 'waiter'),
      getRatingDistribution(restaurantId, 'dish'),
    ]).then(([rest, wait, dish]) => ({
      restaurant: rest,
      waiter: wait,
      dish: dish,
    })),
  ])

  return (
    <ReviewsClient
      restaurantId={restaurantId}
      metrics={metrics as any}
      reviews={recent as any[]}
      dishMetrics={dishMetrics as any}
      ratingDistributions={ratingDist as any}
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
        topDishes: 'Pratos Mais Bem Avaliados',
        needsImprovement: 'Pratos que Precisam Melhorar',
        ratingDistribution: 'Distribuição de Notas',
        statistics: 'Estatísticas',
      }}
    />
  )
}
