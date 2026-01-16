'use client'

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
  const maxValue = Math.max(
    1,
    ...data.flatMap((d) => Object.values(d.values || {}))
  )

  const width = 100
  const height = 40
  const xStep = data.length > 1 ? width / (data.length - 1) : width

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

  return (
    <div className="space-y-3">
      {monthLabel && (
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-500/30 rounded-full text-sm font-semibold text-stone-800 dark:text-amber-200">
            {monthLabel}
          </span>
        </div>
      )}
      <div className="relative w-full h-64">
        {data.length === 0 || series.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-stone-500 dark:text-stone-400">
            {emptyLabel || 'Sem dados neste mês'}
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <line
                key={v}
                x1={0}
                x2={width}
                y1={height * v}
                y2={height * v}
                stroke="#e5e7eb"
                strokeWidth={0.2}
                className="dark:stroke-white/10"
              />
            ))}
            {series.map((s) => (
              <g key={s.id}>
                <path
                  d={buildPath(s.id)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={`${buildPath(s.id)} L ${width} ${height} L 0 ${height} Z`}
                  fill={`${s.color}20`}
                  stroke="none"
                />
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Legend */}
      {series.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-stone-700 dark:text-stone-200">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Daily labels */}
      {data.length > 0 && series.length > 0 && (
        <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <span>Dia 1</span>
          <span>Dia {data.length}</span>
        </div>
      )}
    </div>
  )
}
