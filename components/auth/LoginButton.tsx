'use client'

import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'

interface LoginButtonProps {
  redirectUrl?: string  // kept for backward compatibility but not used anymore
}

export default function LoginButton({ redirectUrl }: LoginButtonProps) {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const callbackUrl = `${window.location.origin}/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      console.error('Error logging in:', error.message)
    }
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="group relative w-full"
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition-all duration-300 group-hover:blur-md" />
      
      {/* Button content */}
      <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-stone-900 rounded-xl font-semibold text-gray-900 dark:text-white transition-all duration-300 shadow-xl group-hover:shadow-2xl">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
          <FcGoogle className="text-2xl" />
        </div>
        <span className="text-lg">Fazer Login</span>
        
        {/* Arrow animation */}
        <svg 
          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300 text-amber-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </button>
  )
}
