import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  try {
    const { restaurantId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createClient()

    // Get categories first
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .limit(1)

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 400 })
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const categoryId = categories[0].id

    // Get dishes for preview
    const { data: items, error: itemsError } = await supabase
      .from('dishes')
      .select('id, name, description, base_price, image_urls')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .limit(limit)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    return NextResponse.json({ items: items || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
