import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  console.log('[CALLBACK] Starting OAuth callback')
  console.log('[CALLBACK] Code:', code ? 'present' : 'missing')
  console.log('[CALLBACK] Origin:', origin)

  let user = null
  let hasRestaurant = false

  if (code) {
    try {
      const supabase = await createClient()
      console.log('[CALLBACK] Exchanging code for session...')
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[CALLBACK] Exchange error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      console.log('[CALLBACK] Code exchange successful')
      
      // Após trocar o código, buscar usuário e restaurante
      const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('[CALLBACK] Get user error:', userError)
        return NextResponse.redirect(`${origin}/login?error=user_fetch_failed`)
      }

      console.log('[CALLBACK] User:', supaUser?.id)
      user = supaUser

      if (user) {
        try {
          const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', user.id)
            .single()
          
          if (!restaurantError) {
            hasRestaurant = !!restaurant
            console.log('[CALLBACK] Has restaurant:', hasRestaurant)
          }
        } catch (restaurantError) {
          console.error('[CALLBACK] Restaurant check error:', restaurantError)
          // Continue without restaurant info
        }
      }
    } catch (error) {
      console.error('[CALLBACK] General error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_failed`)
    }
  } else {
    console.error('[CALLBACK] No code provided')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  // Redireciona para onboarding se não tiver restaurante, senão dashboard
  const redirectUrl = !hasRestaurant ? `${origin}/onboarding` : `${origin}/dashboard`
  console.log('[CALLBACK] Redirecting to:', redirectUrl)
  
  const response = NextResponse.redirect(redirectUrl)
  return response
}
