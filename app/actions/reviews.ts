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
