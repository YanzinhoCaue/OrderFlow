"use client"

import { useMemo, useState } from 'react'
import { FiStar, FiSearch, FiClock, FiTrendingUp, FiTrendingDown, FiBarChart3 } from 'react-icons/fi'

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
  dishMetrics?: {
    byDish: Record<string, { avg: number; count: number; name: string }>
    topDishes: Array<{ dishId: string; dishName: string; avg: number; count: number; topComments: string[] }>
    bottomDishes: Array<{ dishId: string; dishName: string; avg: number; count: number; topComments: string[] }>
  }
  ratingDistributions?: {
    restaurant: Record<1 | 2 | 3 | 4 | 5, number>
    waiter: Record<1 | 2 | 3 | 4 | 5, number>
    dish: Record<1 | 2 | 3 | 4 | 5, number>
  }
  labels?: {
    title: string
    heading: string
    subtitle: string
    noReviews: string
    noReviewsDescription: string
    rating: string
    dish: string
    waiter: string
    restaurant: string
    comment: string
    all: string
    searchPlaceholder: string
    topDishes?: string
    needsImprovement?: string
    ratingDistribution?: string
    statistics?: string
  }
}

export default function ReviewsClient({ 
  restaurantId, 
  metrics, 
  reviews, 
  dishMetrics,
  ratingDistributions,
  labels 
}: ReviewsClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'restaurant' | 'waiter' | 'dish'>('all')
  const [selectedTab, setSelectedTab] = useState<'overview' | 'dishes' | 'distribution'>('overview')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      const matchesType = typeFilter === 'all' ? true : r.target_type === typeFilter
      const matchesSearch = !q || (r.comment || '').toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [reviews, search, typeFilter])

  const summaryCards = [
    { key: 'restaurant', label: labels?.restaurant ?? 'Restaurante', ...metrics.restaurant, color: 'from-amber-500 to-orange-500' },
    { key: 'waiter', label: labels?.waiter ?? 'Atendimento', ...metrics.waiter, color: 'from-blue-500 to-cyan-500' },
    { key: 'dish', label: labels?.dish ?? 'Pratos', ...metrics.dish, color: 'from-emerald-500 to-green-500' },
  ] as any[]

  const RatingBar = ({ count, total, rating }: { count: number; total: number; rating: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 min-w-[30px]">{rating}★</span>
        <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              rating >= 4 ? 'bg-emerald-500' : rating >= 3 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-stone-600 dark:text-stone-400 min-w-[40px] text-right">{count}</span>
      </div>
    )
  }

  const renderDistribution = (dist: Record<1 | 2 | 3 | 4 | 5, number>) => {
    const total = Object.values(dist).reduce((a, b) => a + b, 0)
    return (
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => (
          <RatingBar key={rating} rating={rating} count={dist[rating as 1 | 2 | 3 | 4 | 5]} total={total} />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">{labels?.heading ?? 'Métricas'}</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            {labels?.title ?? 'Avaliações'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">{labels?.subtitle ?? 'Acompanhe avaliações de clientes por área'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-500/20">
        {['overview', 'dishes', 'distribution'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`px-4 py-2 font-semibold text-sm transition-all border-b-2 ${
              selectedTab === tab
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {tab === 'overview' && 'Visão Geral'}
            {tab === 'dishes' && 'Pratos'}
            {tab === 'distribution' && 'Distribuição'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
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
                  placeholder={labels?.searchPlaceholder ?? 'Buscar por comentário...'}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all','restaurant','waiter','dish'] as const).map((status) => {
                  const labelMap: Record<typeof status, string> = { all: labels?.all ?? 'Todos', restaurant: labels?.restaurant ?? 'Restaurante', waiter: labels?.waiter ?? 'Atendimento', dish: labels?.dish ?? 'Pratos' } as any
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

          {/* Avaliações - Lista */}
          {filtered.length === 0 ? (
            <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">{labels?.noReviews ?? 'Nenhuma avaliação'}</h3>
              <p className="text-stone-600 dark:text-stone-400">{labels?.noReviewsDescription ?? 'As avaliações aparecerão aqui quando os clientes começarem a enviar feedback.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((r) => (
                <div key={r.id} className="group bg-white/90 dark:bg-white/5 border-2 border-amber-500/15 rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <span className="text-xs px-2 py-1 rounded-full border bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
                          {r.target_type === 'restaurant' ? (labels?.restaurant ?? 'Restaurante') : r.target_type === 'waiter' ? (labels?.waiter ?? 'Atendimento') : (labels?.dish ?? 'Prato')}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} className={i < r.rating ? 'text-amber-500' : 'text-stone-300 dark:text-stone-600'} />
                          ))}
                          <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">{r.rating}.0</span>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-stone-700 dark:text-stone-300 line-clamp-3 mt-2">{r.comment}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-2">
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
      )}

      {/* Dishes Tab */}
      {selectedTab === 'dishes' && dishMetrics && (
        <div className="space-y-8">
          {/* Top Dishes */}
          {dishMetrics.topDishes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="text-emerald-500" size={20} />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">{labels?.topDishes ?? 'Pratos Mais Bem Avaliados'}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dishMetrics.topDishes.map((dish, idx) => (
                  <div key={dish.dishId} className="bg-white/80 dark:bg-white/5 border-2 border-emerald-500/20 rounded-2xl shadow-lg backdrop-blur-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-white line-clamp-1">{dish.dishName}</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600 dark:text-stone-400">Nota média</span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dish.avg}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600 dark:text-stone-400">Avaliações</span>
                        <span className="text-lg font-semibold text-stone-700 dark:text-stone-300">{dish.count}</span>
                      </div>
                      {dish.topComments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-amber-100/60 dark:border-amber-400/10">
                          <p className="text-xs text-stone-600 dark:text-stone-400 mb-1 font-semibold">Comentário</p>
                          <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-2 italic">"{dish.topComments[0]}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Dishes */}
          {dishMetrics.bottomDishes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FiTrendingDown className="text-red-500" size={20} />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">{labels?.needsImprovement ?? 'Pratos que Precisam Melhorar'}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dishMetrics.bottomDishes.map((dish, idx) => (
                  <div key={dish.dishId} className="bg-white/80 dark:bg-white/5 border-2 border-red-500/20 rounded-2xl shadow-lg backdrop-blur-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold flex items-center justify-center">
                        ⚠
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-white line-clamp-1">{dish.dishName}</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600 dark:text-stone-400">Nota média</span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">{dish.avg}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600 dark:text-stone-400">Avaliações</span>
                        <span className="text-lg font-semibold text-stone-700 dark:text-stone-300">{dish.count}</span>
                      </div>
                      {dish.topComments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-100/60 dark:border-red-400/10">
                          <p className="text-xs text-stone-600 dark:text-stone-400 mb-1 font-semibold">Feedback</p>
                          <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-2 italic">"{dish.topComments[0]}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dishMetrics.topDishes.length === 0 && dishMetrics.bottomDishes.length === 0 && (
            <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">Sem avaliações de pratos</h3>
              <p className="text-stone-600 dark:text-stone-400">Avaliações de pratos aparecerão aqui quando clientes começarem a avaliar.</p>
            </div>
          )}
        </div>
      )}

      {/* Distribution Tab */}
      {selectedTab === 'distribution' && ratingDistributions && (
        <div className="space-y-8">
          {[
            { key: 'restaurant', label: labels?.restaurant ?? 'Restaurante' },
            { key: 'waiter', label: labels?.waiter ?? 'Atendimento' },
            { key: 'dish', label: labels?.dish ?? 'Pratos' },
          ].map(({ key, label }) => (
            <div key={key} className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiBarChart3 className="text-amber-600 dark:text-amber-400" size={20} />
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">{label}</h2>
              </div>
              {renderDistribution(ratingDistributions[key as 'restaurant' | 'waiter' | 'dish'])}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
