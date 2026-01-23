'use client'

import { FcGoogle } from 'react-icons/fc'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LoginButtonProps {
  redirectUrl?: string  // kept for backward compatibility but not used anymore
}

export default function LoginButton({ redirectUrl }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if Supabase env vars are available
  const hasSupabaseConfig = !!(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const handleGoogleLogin = async () => {
    if (!hasSupabaseConfig) {
      setError('Supabase não está configurado. Contate o administrador.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      const callbackUrl = `${window.location.origin}/callback`
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (authError) {
        console.error('Error logging in:', authError.message)
        setError(authError.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Login error:', message)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGoogleLogin}
        disabled={!hasSupabaseConfig || isLoading}
        className="group relative w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition-all duration-300 group-hover:blur-md disabled:opacity-0" />
        
        {/* Button content */}
        <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-stone-900 rounded-xl font-semibold text-gray-900 dark:text-white transition-all duration-300 shadow-xl group-hover:shadow-2xl">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
            <FcGoogle className="text-2xl" />
          </div>
          <span className="text-lg">
            {isLoading ? 'Conectando...' : 'Fazer Login'}
          </span>
          
          {/* Arrow animation */}
          {!isLoading && (
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300 text-amber-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </div>
      </button>

      {error && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {!hasSupabaseConfig && (
        <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm">
          ⚠️ Variáveis de ambiente Supabase não configuradas
        </div>
      )}
    </div>
  )
}
