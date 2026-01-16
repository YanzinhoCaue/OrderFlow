export interface Restaurant {
  id: string
  owner_id: string
  name: string
  slug: string
  description?: string
  phone?: string
  logo_url?: string
  cover_url?: string
  theme_color: string
  business_hours?: Array<{
    day: string
    openTime: string
    closeTime: string
    closed: boolean
  }> | null
  social_media?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
    twitter?: string
    tiktok?: string
  } | null
  payment_settings?: {
    methods: Array<{
      id: string
      name: string
      enabled: boolean
    }>
    serviceFee?: number
    serviceFeetype?: 'percentage' | 'fixed'
    acceptsCash?: boolean
    pixKey?: string
  } | null
  pix_key?: string | null
  is_active: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  cpf_cnpj?: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  restaurants?: Restaurant[]
}
