'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get user profile with restaurant data
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      restaurants (*)
    `)
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding() {
  const profile = await getUserProfile()

  if (!profile) {
    return false
  }

  const restaurant = (profile as any).restaurants?.[0]
  return restaurant && restaurant.onboarding_completed
}
