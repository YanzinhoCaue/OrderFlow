'use client'

import { useState, useEffect } from 'react'
import { FiChevronDown } from 'react-icons/fi'

interface MenuPreviewProps {
  restaurant: any
}

export default function MenuPreview({ restaurant }: MenuPreviewProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    // Fetch menu items for preview
    const fetchMenuData = async () => {
      try {
        const response = await fetch(`/api/menu/${restaurant.id}?limit=3`)
        if (response.ok) {
          const data = await response.json()
          setPreview(data)
        }
      } catch (error) {
        console.error('Error fetching menu preview:', error)
      }
    }

    fetchMenuData()
  }, [restaurant.id])

  return (
    <div className="border-t border-amber-500/20 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
      >
        <span>Preview do Cardápio</span>
        <FiChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="mt-3 p-4 rounded-xl border-2 overflow-hidden"
          style={{
            backgroundColor: restaurant.theme_color ? `${restaurant.theme_color}15` : '#f5f5f4',
            borderColor: restaurant.theme_color || '#d4d4d8',
          }}
        >
          {/* Header */}
          <div className="mb-4">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-12 w-12 rounded-lg object-cover mb-2"
              />
            )}
            <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">
              {restaurant.name}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {restaurant.description?.substring(0, 50)}...
            </p>
          </div>

          {/* Menu Items Preview */}
          {preview?.items && preview.items.length > 0 ? (
            <div className="space-y-2">
              {preview.items.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="p-2 bg-white dark:bg-slate-800/50 rounded-lg border border-stone-200 dark:border-stone-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                        {item.name?.['pt-BR'] || item.name?.en}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
                        {item.description?.['pt-BR'] || item.description?.en}
                      </p>
                    </div>
                    <p
                      className="text-xs font-bold whitespace-nowrap ml-1"
                      style={{ color: restaurant.theme_color || '#d97706' }}
                    >
                      R$ {item.base_price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-600 dark:text-stone-400 text-center py-2">
              Nenhum prato adicionado
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Cor do cardápio: <span className="font-semibold">{restaurant.theme_color || '#D97706'}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
