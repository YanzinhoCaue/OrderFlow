import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, restaurants(*)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      redirect('/onboarding')
    }

    const restaurant = profile.restaurants?.[0]
    
    if (!restaurant || !restaurant.onboarding_completed) {
      redirect('/onboarding')
    }

    redirect('/dashboard')
  }

  redirect('/login')
}
