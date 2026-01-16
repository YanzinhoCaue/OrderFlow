import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleanDocument = body.cpfCnpj?.replace(/\D/g, '') || null

    // Update restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .update({
        name: body.restaurantName,
        phone: body.restaurantPhone,
        description: body.description,
        theme_color: body.themeColor,
        logo_url: body.logoUrl,
        cover_url: body.coverUrl,
        business_hours: body.businessHours || null,
        social_media: body.socialMedia || null,
        payment_settings: body.paymentSettings || null,
        pix_key: body.paymentSettings?.pixKey || null,
      })
      .eq('owner_id', user.id)
      .select()
      .single()

    if (restaurantError) {
      return NextResponse.json({ error: restaurantError.message }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: body.ownerName,
        phone: body.ownerPhone,
        cpf_cnpj: cleanDocument,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ restaurant, profile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
