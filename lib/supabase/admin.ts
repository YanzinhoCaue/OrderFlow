import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

/**
 * Creates an admin Supabase client with service_role key
 * This client bypasses RLS policies and should only be used in server-side code
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔐 Verificando variáveis de ambiente:')
  console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'definida' : '❌ NÃO DEFINIDA')
  console.log('✓ SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRole ? 'definida (comprimento: ' + supabaseServiceRole.length + ')' : '❌ NÃO DEFINIDA')

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
