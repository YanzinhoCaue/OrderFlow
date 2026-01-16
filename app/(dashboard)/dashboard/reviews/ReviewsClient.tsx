"use client"

import { useMemo, useState } from 'react'
import { FiStar, FiSearch, FiClock } from 'react-icons/fi'

interface ReviewsClientProps {
  restaurantId: string
  metrics: {
    restaurant: { count: number; avg: number }
    waiter: { count: number; avg: number }
    dish: { count: number; avg: number }
  }
  reviews: Array<{
    id: string
    target_type: 'restaurant' | 'waiter' | 'dish'
    rating: number
    comment?: string | null
    created_at: string
  }>
}

export default function ReviewsClient({ restaurantId, metrics, reviews }: ReviewsClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'restaurant' | 'waiter' | 'dish'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      const matchesType = typeFilter === 'all' ? true : r.target_type === typeFilter
      const matchesSearch = !q || (r.comment || '').toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [reviews, search, typeFilter])

  const summaryCards = [
    { key: 'restaurant', label: 'Restaurante', ...metrics.restaurant, color: 'from-amber-500 to-orange-500' },
    { key: 'waiter', label: 'Atendimento', ...metrics.waiter, color: 'from-blue-500 to-cyan-500' },
    { key: 'dish', label: 'Pratos', ...metrics.dish, color: 'from-emerald-500 to-green-500' },
  ] as any[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">Métricas</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            Avaliações
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">Acompanhe avaliações de clientes por área</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setTypeFilter(card.key)}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
              typeFilter === card.key ? 'border-amber-500 shadow-amber-500/30 shadow-lg' : 'border-amber-500/20'
            } bg-white/80 dark:bg-slate-900/70 backdrop-blur-lg text-left px-4 py-3`}
          >
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${card.color}`} />
            <div className="relative flex items-center gap-3">
              <FiStar className="text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400">{card.label}</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">{card.avg} <span className="text-sm text-stone-500">({card.count})</span></p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros e busca */}
      <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por comentário..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all','restaurant','waiter','dish'] as const).map((status) => {
              const labelMap: Record<typeof status, string> = { all: 'Todos', restaurant: 'Restaurante', waiter: 'Atendimento', dish: 'Pratos' } as any
              const isActive = typeFilter === status
              return (
                <button
                  key={status}
                  onClick={() => setTypeFilter(status)}
                  className={`px-3 py-2 rounded-full text-xs font-medium border transition-all ${
                    isActive ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200 shadow-sm' : 'border-amber-500/30 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {labelMap[status]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">Nenhuma avaliação</h3>
          <p className="text-stone-600 dark:text-stone-400">As avaliações aparecerão aqui quando os clientes começarem a enviar feedback.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <div key={r.id} className="group bg-white/90 dark:bg-white/5 border-2 border-amber-500/15 rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl overflow-hidden">
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs px-2 py-1 rounded-full border bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
                      {r.target_type === 'restaurant' ? 'Restaurante' : r.target_type === 'waiter' ? 'Atendimento' : 'Prato'}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < r.rating ? 'text-amber-500' : 'text-stone-300 dark:text-stone-600'} />
                      ))}
                    </div>
                    {r.comment && (
                      <p className="text-sm text-stone-700 dark:text-stone-300 line-clamp-3">{r.comment}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                      <FiClock />
                      <span>{new Date(r.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
