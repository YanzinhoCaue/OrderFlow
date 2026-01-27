'use server'

import { createClient } from '@/lib/supabase/server'

export async function getReviewMetrics(restaurantId: string) {
  const supabase = await createClient()

  // Aggregate metrics per target_type
  const { data, error } = await supabase
    .from('reviews')
    .select('target_type, rating')
    .eq('restaurant_id', restaurantId)

  if (error || !data) return { restaurant: { count: 0, avg: 0 }, waiter: { count: 0, avg: 0 }, dish: { count: 0, avg: 0 } }

  const acc: Record<string, { sum: number; count: number }> = { restaurant: { sum: 0, count: 0 }, waiter: { sum: 0, count: 0 }, dish: { sum: 0, count: 0 } }
  for (const row of data as any[]) {
    const key = row.target_type as 'restaurant' | 'waiter' | 'dish'
    acc[key].sum += Number(row.rating || 0)
    acc[key].count += 1
  }

  const toAvg = (x: { sum: number; count: number }) => ({ count: x.count, avg: x.count ? Number((x.sum / x.count).toFixed(2)) : 0 })
  return { restaurant: toAvg(acc.restaurant), waiter: toAvg(acc.waiter), dish: toAvg(acc.dish) }
}

export async function getDishReviews(restaurantId: string) {
  const supabase = await createClient()

  // Get all dish reviews with dish names from order_items
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, target_id, rating, comment, created_at, target_type')
    .eq('restaurant_id', restaurantId)
    .eq('target_type', 'dish')
    .order('created_at', { ascending: false })

  if (error || !reviews) return []

  // Fetch dish names from dishes table for each review
  const reviewsWithNames = await Promise.all(
    reviews.map(async (review: any) => {
      let dishName = 'Prato desconhecido'
      if (review.target_id) {
        const { data: dish } = await supabase
          .from('dishes')
          .select('name')
          .eq('id', review.target_id)
          .single()
        if (dish) {
          const dishData = dish as any
          dishName = typeof dishData.name === 'string' ? dishData.name : dishData.name?.['pt-BR'] || dishData.name?.['en-US'] || 'Prato'
        }
      }
      return { ...review, dishName }
    })
  )

  return reviewsWithNames
}

export async function getDishMetrics(restaurantId: string) {
  const supabase = await createClient()

  // Get all dish reviews
  const { data, error } = await supabase
    .from('reviews')
    .select('target_id, rating, comment, created_at, target_type')
    .eq('restaurant_id', restaurantId)
    .eq('target_type', 'dish')

  if (error || !data) return { byDish: {}, topDishes: [], bottomDishes: [] }

  // Group by dish
  const byDish: Record<string, { sum: number; count: number; comments: string[] }> = {}
  for (const row of data as any[]) {
    const dishId = row.target_id || 'unknown'
    if (!byDish[dishId]) {
      byDish[dishId] = { sum: 0, count: 0, comments: [] }
    }
    byDish[dishId].sum += Number(row.rating || 0)
    byDish[dishId].count += 1
    if (row.comment) byDish[dishId].comments.push(row.comment)
  }

  // Fetch dish names
  const dishIds = Object.keys(byDish).filter((id) => id !== 'unknown')
  const { data: dishes } = await supabase
    .from('dishes')
    .select('id, name')
    .in('id', dishIds)

  const dishNameMap: Record<string, string> = {}
  if (dishes) {
    for (const dish of dishes) {
      const dishData = dish as any
      const name = typeof dishData.name === 'string' ? dishData.name : dishData.name?.['pt-BR'] || dishData.name?.['en-US'] || 'Prato'
      dishNameMap[(dish as any).id] = name
    }
  }

  // Build final metrics
  const dishMetrics = Object.entries(byDish).map(([dishId, stats]) => {
    const avg = stats.count ? Number((stats.sum / stats.count).toFixed(2)) : 0
    return {
      dishId,
      dishName: dishNameMap[dishId] || 'Prato desconhecido',
      avg,
      count: stats.count,
      topComments: stats.comments.slice(0, 2),
    }
  })

  // Sort by avg (descending) and count (descending)
  const sorted = dishMetrics.sort((a, b) => {
    if (b.avg !== a.avg) return b.avg - a.avg
    return b.count - a.count
  })

  return {
    byDish: Object.fromEntries(
      dishMetrics.map((m) => [m.dishId, { avg: m.avg, count: m.count, name: m.dishName }])
    ),
    topDishes: sorted.slice(0, 5),
    bottomDishes: sorted.filter((d) => d.count >= 2).slice(-3).reverse(),
  }
}

export async function getRatingDistribution(restaurantId: string, targetType: 'restaurant' | 'waiter' | 'dish' = 'restaurant') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('restaurant_id', restaurantId)
    .eq('target_type', targetType)

  if (error || !data) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of data as any[]) {
    const rating = Math.min(5, Math.max(1, Number(row.rating || 0))) as 1 | 2 | 3 | 4 | 5
    dist[rating]++
  }

  return dist
}

export async function getRecentReviews(restaurantId: string, limit: number = 12) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}
