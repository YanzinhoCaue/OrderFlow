import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET_MAP: Record<string, string> = {
  logo: 'restaurant-logos',
  cover: 'restaurant-covers',
}

export async function POST(request: Request) {
  try {
    console.log('[brand upload] iniciando upload')
    
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[brand upload] user:', user?.id)

    if (!user) {
      console.log('[brand upload] usuário não autenticado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const restaurantId = formData.get('restaurantId') as string | null
    const type = (formData.get('type') as string | null) || 'logo'

    console.log('[brand upload] file:', file?.name, 'size:', file?.size, 'restaurantId:', restaurantId, 'type:', type)

    if (!file || !restaurantId) {
      console.log('[brand upload] arquivo ou restaurante faltando')
      return NextResponse.json({ error: 'Arquivo e restaurante são obrigatórios' }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(restaurantId)) {
      console.log('[brand upload] restaurantId inválido (não é UUID):', restaurantId)
      return NextResponse.json({ error: 'ID do restaurante inválido' }, { status: 400 })
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, owner_id')
      .eq('id', restaurantId)
      .single()

    console.log('[brand upload] restaurant:', restaurant?.id, 'owner:', restaurant?.owner_id, 'error:', restaurantError)

    if (!restaurant || restaurant.owner_id !== user.id) {
      console.log('[brand upload] restaurante não encontrado ou sem permissão')
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    const bucket = BUCKET_MAP[type]
    if (!bucket) {
      console.log('[brand upload] tipo inválido:', type)
      return NextResponse.json({ error: 'Tipo de imagem inválido' }, { status: 400 })
    }

    // Basic validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('[brand upload] tipo não permitido:', file.type)
      return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('[brand upload] arquivo muito grande:', file.size)
      return NextResponse.json({ error: 'Imagem muito grande (máx. 5MB)' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${restaurantId}/${type}-${Date.now()}.${fileExt}`

    console.log('[brand upload] fazendo upload para', bucket, 'arquivo:', fileName)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    console.log('[brand upload] upload result - data:', data, 'error:', error)

    if (error) {
      console.log('[brand upload] erro no upload:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[brand upload] url gerada:', urlData.publicUrl)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error: any) {
    console.log('[brand upload] exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
