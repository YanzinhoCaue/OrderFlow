'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { generateSlug } from '@/lib/utils/slug'
import { validateCPF } from '@/lib/validations/cpf'
import { validateCNPJ } from '@/lib/validations/cnpj'
import { revalidatePath } from 'next/cache'

interface OnboardingData {
  restaurantName: string
  restaurantPhone: string
  restaurantDescription?: string
  ownerName: string
  cpfCnpj: string
  logoUrl?: string
  coverUrl?: string
  themeColor: string
}

/**
 * Complete restaurant onboarding
 */
export async function completeOnboarding(data: OnboardingData) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate CPF/CNPJ
    const cleanDoc = data.cpfCnpj.replace(/\D/g, '')
    const isValid = cleanDoc.length === 11 
      ? validateCPF(cleanDoc) 
      : validateCNPJ(cleanDoc)

    if (!isValid) {
      return { success: false, error: 'Invalid CPF/CNPJ' }
    }

    // Generate unique slug
    const baseSlug = generateSlug(data.restaurantName)
    const { data: existingSlugs } = await supabase
      .from('restaurants')
      .select('slug')
      .like('slug', `${baseSlug}%`)

    const slugs = existingSlugs?.map(r => r.slug) || []
    let slug = baseSlug
    let counter = 1

    while (slugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: data.ownerName,
        cpf_cnpj: cleanDoc,
        phone: data.restaurantPhone,
        avatar_url: user.user_metadata.avatar_url,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return { success: false, error: 'Failed to create profile' }
    }

    // Create restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: user.id,
        name: data.restaurantName,
        slug,
        description: data.restaurantDescription,
        phone: data.restaurantPhone,
        logo_url: data.logoUrl,
        cover_url: data.coverUrl,
        theme_color: data.themeColor,
        onboarding_completed: true,
        is_active: true,
      })
      .select()
      .single()

    if (restaurantError) {
      console.error('Restaurant error:', restaurantError)
      return { success: false, error: 'Failed to create restaurant' }
    }

    revalidatePath('/')
    return { success: true, restaurant }
  } catch (error) {
    console.error('Onboarding error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${path}-${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: 'Failed to upload file' }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
