import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    // If user is authenticated, allow onboarding even if profile doesn't exist yet
    // Check if there is already a restaurant for this user (might indicate onboarding done)
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (restaurant && (restaurant as any).onboarding_completed) {
        redirect('/dashboard')
      }
    } catch (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError)
      // Continue with onboarding if restaurant fetch fails
    }

    return <OnboardingWizard />
  } catch (error) {
    console.error('Error in OnboardingPage:', error)
    redirect('/login')
  }
}
