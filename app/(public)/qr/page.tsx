'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

export default function QRScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle token from URL or manual input
  const handleToken = async (qrToken: string) => {
    if (!qrToken.trim()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get table by token
      const { data: table, error: tableError } = await (supabase as any)
        .from('tables')
        .select('restaurant_id, restaurants(slug)')
        .eq('qr_code_token', qrToken.trim())
        .eq('is_active', true)
        .single()

      if (tableError || !table) {
        setError('QR code inválido. Mesa não encontrada.')
        setLoading(false)
        return
      }

      // Redirect to menu
      type TableWithRestaurant = Database['public']['Tables']['tables']['Row'] & { restaurants: { slug: string } }
      const tableData = table as TableWithRestaurant
      router.push(`/menu/${tableData.restaurants.slug}/${qrToken.trim()}`)
    } catch (err) {
      console.error('Error validating QR code:', err)
      setError('Erro ao ler QR code. Tente novamente.')
      setLoading(false)
    }
  }

  // Check if token came in URL params
  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      handleToken(urlToken)
    } else {
      // Focus input for manual entry
      inputRef.current?.focus()
    }
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleToken(token)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-amber-200/30 dark:border-gray-700/30 p-8 md:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              iMenuFlow
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Escaneie o QR code da sua mesa
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full"></div>
                </div>
              </div>
              <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
                Validando QR code...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-200 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Input Form */}
          {!loading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="token"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Token do QR Code
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="token"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value)
                    setError(null)
                  }}
                  placeholder="Cole o código aqui..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!token.trim()}
                className="w-full px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Acessar Cardápio
              </button>
            </form>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">💡 Dica:</span> Procure pelo QR code na sua mesa ou peça para o garçom.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
