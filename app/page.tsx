import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Get profile + restaurants
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, restaurants(*)')
      .eq('id', user.id)
      .single()

    // If user has a completed restaurant, go to dashboard (owner)
    const restaurant = profile && (profile as any).restaurants?.[0]
    if (restaurant && (restaurant as any).onboarding_completed) {
      redirect('/dashboard')
    }

    // Otherwise, treat as customer and go to menu
    redirect('/menu')
  }

  redirect('/login')
}
