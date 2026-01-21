'use client'

import { useState, useCallback, useMemo } from 'react'

interface Series {
  id: string
  name: string
  color: string
}

interface DaySeries {
  day: number
  values: Record<string, number>
}

interface Props {
  data: DaySeries[]
  series: Series[]
  emptyLabel?: string
  monthLabel?: string
}

export default function MonthlyTopDishesChart({ data, series, emptyLabel, monthLabel }: Props) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const maxValue = Math.max(
    1,
    ...data.flatMap((d) => Object.values(d.values || {}))
  )

  const width = 100
  const height = 40
  const xStep = data.length > 1 ? width / (data.length - 1) : width

  // Calcular totais por série
  const seriesTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    series.forEach((s) => {
      totals[s.id] = data.reduce((sum, d) => sum + (d.values[s.id] || 0), 0)
    })
    return totals
  }, [data, series])

  const grandTotal = useMemo(() => {
    return Object.values(seriesTotals).reduce((sum, val) => sum + val, 0)
  }, [seriesTotals])

  const buildPath = (seriesId: string) => {
    if (!data.length) return ''
    return data
      .map((point, idx) => {
        const x = idx * xStep
        const yVal = point.values[seriesId] || 0
        const y = height - (yVal / maxValue) * height
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>, dayIndex: number) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setHoveredDay(dayIndex)
      setTooltipPosition({ x, y })
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredDay(null)
  }, [])

  const toggleSeriesHover = useCallback((seriesId: string | null) => {
    setHoveredSeries((prev) => (prev === seriesId ? null : seriesId))
  }, [])

  const getSeriesOpacity = (seriesId: string) => {
    if (hoveredSeries === null) return 1
    return hoveredSeries === seriesId ? 1 : 0.3
  }

  return (
    <div className="space-y-4">
      {monthLabel && (
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-500/30 rounded-full text-sm font-semibold text-stone-800 dark:text-amber-200">
            {monthLabel}
          </span>
        </div>
      )}

      {/* Stats Summary com visual futurista */}
      {series.length > 0 && grandTotal > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {series.map((s, idx) => {
            const total = seriesTotals[s.id] || 0
            const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0'
            const isActive = hoveredSeries === s.id
            return (
              <div
                key={s.id}
                className="group relative p-4 rounded-xl bg-gradient-to-br from-stone-50/80 to-stone-100/60 dark:from-stone-900/40 dark:to-stone-800/30 backdrop-blur-sm border transition-all duration-300 cursor-pointer overflow-hidden"
                style={{
                  borderColor: isActive ? s.color : 'rgba(245, 158, 11, 0.2)',
                  boxShadow: isActive ? `0 0 20px ${s.color}40` : 'none',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
                onClick={() => toggleSeriesHover(s.id)}
              >
                {/* Efeito de brilho no fundo */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${s.color}15, transparent 70%)`,
                  }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-1.5 h-8 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: isActive ? `0 0 12px ${s.color}` : 'none',
                      }}
                    />
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                      {s.name}
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold bg-gradient-to-br from-stone-900 to-stone-700 dark:from-amber-200 dark:to-orange-300 bg-clip-text text-transparent">
                        {total}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                        VENDAS NO PERÍODO
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xl font-bold"
                        style={{ color: s.color }}
                      >
                        {percentage}%
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        DO TOTAL
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de progresso no bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-200/50 dark:bg-stone-700/50">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: s.color,
                      boxShadow: `0 0 10px ${s.color}80`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="relative w-full h-80 rounded-xl bg-gradient-to-br from-stone-50/50 to-stone-100/30 dark:from-stone-900/30 dark:to-stone-800/20 backdrop-blur-sm border border-amber-500/20 p-6 mb-20">
        {/* Grid de fundo futurista */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />
        </div>

        {data.length === 0 || series.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-30">📊</div>
              <div className="text-stone-500 dark:text-stone-400 font-medium">
                {emptyLabel || 'Sem dados neste mês'}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
              <defs>
                {/* Gradientes para as linhas */}
                {series.map((s) => (
                  <linearGradient key={`grad-${s.id}`} id={`gradient-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0.1" />
                  </linearGradient>
                ))}
              </defs>

              {/* Grid lines minimalista */}
              {[0, 0.25, 0.5, 0.75, 1].map((v, idx) => {
                const yValue = Math.round(maxValue * (1 - v))
                return (
                  <g key={v}>
                    <line
                      x1={0}
                      x2={width}
                      y1={height * v}
                      y2={height * v}
                      stroke="currentColor"
                      strokeWidth={0.15}
                      className="text-amber-500/20 dark:text-amber-400/10"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={-1.5}
                      y={height * v}
                      fontSize={2.5}
                      fill="currentColor"
                      className="text-stone-400 dark:text-stone-500 font-mono"
                      textAnchor="end"
                      dominantBaseline="middle"
                    >
                      {yValue}
                    </text>
                  </g>
                )
              })}

              {/* Séries com efeito glassmorphism */}
              {series.map((s, idx) => (
                <g
                  key={s.id}
                  style={{
                    opacity: getSeriesOpacity(s.id),
                    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Área preenchida com gradiente */}
                  <path
                    d={`${buildPath(s.id)} L ${width} ${height} L 0 ${height} Z`}
                    fill={`url(#gradient-${s.id})`}
                    className="transition-opacity duration-300"
                    style={{
                      opacity: hoveredSeries === s.id ? 0.6 : 0.3,
                    }}
                  />

                  {/* Linha principal fina e nítida */}
                  <path
                    d={buildPath(s.id)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={hoveredSeries === s.id ? 0.8 : 0.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                    style={{
                      filter: hoveredSeries === s.id 
                        ? `drop-shadow(0 0 4px ${s.color}) drop-shadow(0 0 8px ${s.color}60)` 
                        : 'none',
                    }}
                  />

                  {/* Pontos de dados sutis */}
                  {data.map((point, pointIdx) => {
                    const x = pointIdx * xStep
                    const yVal = point.values[s.id] || 0
                    const y = height - (yVal / maxValue) * height
                    const isHovered = hoveredDay === pointIdx
                    
                    if (yVal === 0) return null
                    
                    return (
                      <g key={`${s.id}-${pointIdx}`}>
                        {/* Círculo externo glow quando hover */}
                        {isHovered && (
                          <circle
                            cx={x}
                            cy={y}
                            r={1.5}
                            fill={s.color}
                            opacity="0.3"
                            className="animate-pulse"
                          />
                        )}
                        {/* Ponto principal */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 0.7 : 0.3}
                          fill={isHovered ? s.color : 'white'}
                          stroke={s.color}
                          strokeWidth={isHovered ? 0.3 : 0.15}
                          className="transition-all duration-200"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 3px ${s.color})` : 'none',
                          }}
                        />
                      </g>
                    )
                  })}
                </g>
              ))}

              {/* Áreas de hover */}
              {data.map((point, idx) => {
                const x = idx * xStep
                const rectWidth = xStep > 2 ? xStep : 2
                return (
                  <rect
                    key={`hover-${idx}`}
                    x={x - rectWidth / 2}
                    y={0}
                    width={rectWidth}
                    height={height}
                    fill="transparent"
                    onMouseMove={(e) => handleMouseMove(e, idx)}
                    onMouseLeave={handleMouseLeave}
                    className="cursor-crosshair"
                  />
                )
              })}
            </svg>

            {/* Tooltip futurista */}
            {hoveredDay !== null && data[hoveredDay] && (
              <div
                className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${Math.max(tooltipPosition.y - 20, 60)}px`,
                }}
              >
                <div className="relative">
                  <div className="bg-stone-900/95 dark:bg-stone-950/95 backdrop-blur-xl text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 min-w-[160px] max-w-[220px]">
                    {/* Header do tooltip */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/30">
                      <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                      <span className="font-bold text-sm text-amber-400">
                        Dia {data[hoveredDay].day}
                      </span>
                    </div>
                    
                    {/* Valores por série */}
                    <div className="space-y-2">
                      {series.map((s) => {
                        const value = data[hoveredDay].values[s.id] || 0
                        if (value === 0) return null
                        return (
                          <div key={s.id} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: s.color,
                                  boxShadow: `0 0 6px ${s.color}`,
                                }}
                              />
                              <span className="text-stone-300 truncate max-w-[90px]">
                                {s.name}
                              </span>
                            </div>
                            <span className="font-bold text-white tabular-nums">
                              {value}
                            </span>
                          </div>
                        )
                      })}
                      
                      {/* Total */}
                      <div className="pt-2 mt-2 border-t border-amber-500/30 flex justify-between text-sm font-bold">
                        <span className="text-amber-400">Total</span>
                        <span className="text-white tabular-nums">
                          {series.reduce((sum, s) => sum + (data[hoveredDay].values[s.id] || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seta do tooltip */}
                  <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-stone-900/95 dark:border-t-stone-950/95" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend futurista e interativa */}
      {series.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {series.map((s) => {
            const isActive = hoveredSeries === s.id
            return (
              <button
                key={s.id}
                onClick={() => toggleSeriesHover(s.id)}
                className="group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  backgroundColor: isActive ? `${s.color}20` : 'rgba(245, 158, 11, 0.05)',
                  border: `1.5px solid ${isActive ? s.color : 'rgba(245, 158, 11, 0.2)'}`,
                  opacity: hoveredSeries === null || isActive ? 1 : 0.4,
                  boxShadow: isActive ? `0 0 16px ${s.color}40, inset 0 0 12px ${s.color}20` : 'none',
                }}
              >
                {/* Efeito de brilho no hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${s.color}20, transparent 70%)`,
                  }}
                />
                
                <div className="relative flex items-center gap-2">
                  <div className="relative">
                    {/* Anel externo animado quando ativo */}
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor: s.color,
                          opacity: 0.4,
                        }}
                      />
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-full relative z-10 transition-all duration-300"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: isActive ? `0 0 10px ${s.color}` : `0 0 4px ${s.color}60`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 uppercase tracking-wide">
                    {s.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Indicadores de dia com estilo minimalista */}
      {data.length > 0 && series.length > 0 && (
        <div className="flex justify-between items-center text-xs text-stone-500 dark:text-stone-400 px-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            <span className="font-mono font-semibold">Dia 1</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 mx-4" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">Dia {data.length}</span>
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}
