"use server"

import { createClient } from '@/lib/supabase/server'

export async function uploadDishImage(formData: FormData) {
  try {
    const supabase = await createClient()
    
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurantId') as string
    
    if (!file || !restaurantId) {
      return { success: false, error: 'Arquivo e ID do restaurante são obrigatórios' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Formato não suportado. Use JPG, PNG ou WebP' }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'Imagem muito grande. Máximo 5MB' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${restaurantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('dish-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      
      // Mensagens de erro mais específicas
      if (error.message?.includes('new row violates row-level security')) {
        return { success: false, error: 'Erro de permissão. Configure as políticas RLS no Supabase Storage.' }
      }
      if (error.message?.includes('Bucket not found')) {
        return { success: false, error: 'Bucket "dish-images" não encontrado. Crie-o no Supabase Storage.' }
      }
      
      return { success: false, error: `Erro ao fazer upload: ${error.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('dish-images')
      .getPublicUrl(fileName)

    return {
      success: true,
      url: urlData.publicUrl,
      path: fileName,
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return { success: false, error: `Erro ao processar: ${error?.message || 'Erro desconhecido'}` }
  }
}

export async function deleteDishImage(imagePath: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.storage
      .from('dish-images')
      .remove([imagePath])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: 'Erro ao deletar a imagem' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Erro ao processar a exclusão' }
  }
}
