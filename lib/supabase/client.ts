import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    throw new Error('Supabase configuration is missing')
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}
