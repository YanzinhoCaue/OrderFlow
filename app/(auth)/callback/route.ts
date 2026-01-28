import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  let user = null
  let hasRestaurant = false

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    // Após trocar o código, buscar usuário e restaurante
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    user = supaUser
    if (user) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      hasRestaurant = !!restaurant
    }
  }

  // Redireciona para onboarding se não tiver restaurante, senão dashboard
  if (user && !hasRestaurant) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
