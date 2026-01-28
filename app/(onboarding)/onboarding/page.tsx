import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  // LOGGING: Diagnóstico de autenticação/redirect
  const allCookies = cookies().getAll();
  console.info('[ONBOARDING] INÍCIO');
  console.info('[ONBOARDING] COOKIES:', allCookies);
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.info('[ONBOARDING] USER:', user);
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
      console.info('[ONBOARDING] RESTAURANT:', restaurant);
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
