"use client"

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiEdit2 } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import EditDishModal from '@/components/dashboard/EditDishModal'

interface ViewDishModalProps {
  dish: {
    id: string
    restaurantId: string
    categoryId: string
    name: Record<string, string>
    description?: Record<string, string>
    basePrice: number
    isAvailable?: boolean
    availableDays?: number[]
    images?: Array<{ id: string; imageUrl: string }>
    dishIngredients?: Array<{
      id: string
      ingredient: {
        id: string
        name: Record<string, string>
        price: number
      }
      additionalPrice: number
    }>
  }
  categories: Array<{ id: string; name: Record<string, string> }>
  children?: React.ReactNode
}

const WEEK_DAYS = [
  { id: 0, label: 'Domingo', short: 'Dom' },
  { id: 1, label: 'Segunda', short: 'Seg' },
  { id: 2, label: 'Terça', short: 'Ter' },
  { id: 3, label: 'Quarta', short: 'Qua' },
  { id: 4, label: 'Quinta', short: 'Qui' },
  { id: 5, label: 'Sexta', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
]

export default function ViewDishModal({
  dish,
  categories,
  children,
}: ViewDishModalProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const dishName = typeof dish.name === 'object' ? dish.name['pt-BR'] || dish.name.en : dish.name
  const dishDescription = dish.description && typeof dish.description === 'object' 
    ? (dish.description['pt-BR'] || dish.description.en || '')
    : (dish.description as unknown as string | null)

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      {isEditing && (
        <EditDishModal
          dish={dish}
          categories={categories}
        />
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white">{dishName}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOpen(false)
                    setTimeout(() => setIsEditing(true), 300)
                  }}
                  className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                  title="Editar prato"
                >
                  <FiEdit2 size={20} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Image */}
              {dish.images && dish.images.length > 0 && (
                <div className="relative rounded-lg overflow-hidden h-64 bg-stone-100 dark:bg-stone-800">
                  <img
                    src={dish.images[0].imageUrl}
                    alt={dishName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Name and Price */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{dishName}</h3>
                <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  R$ {dish.basePrice.toFixed(2)}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${dish.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  {dish.isAvailable ? 'Disponível' : 'Indisponível'}
                </span>
              </div>

              {/* Description */}
              {dishDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Descrição</h4>
                  <p className="text-stone-600 dark:text-stone-400">{dishDescription}</p>
                </div>
              )}

              {/* Available Days */}
              {dish.availableDays && dish.availableDays.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Disponível em:</h4>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <div
                        key={day.id}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          dish.availableDays?.includes(day.id)
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-stone-200/50 dark:bg-stone-700/50 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {day.short}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {dish.dishIngredients && dish.dishIngredients.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Ingredientes</h4>
                  <div className="space-y-2">
                    {dish.dishIngredients.map((ing) => {
                      const ingName = typeof ing.ingredient.name === 'object'
                        ? ing.ingredient.name['pt-BR'] || ing.ingredient.name.en
                        : ing.ingredient.name
                      return (
                        <div key={ing.id} className="flex justify-between items-center p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                          <span className="text-stone-700 dark:text-stone-300">{ingName}</span>
                          {ing.additionalPrice > 0 && (
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                              +R$ {ing.additionalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 border-t border-amber-500/20 px-6 py-4 rounded-b-2xl">
              <Button
                onClick={() => setOpen(false)}
                className="w-full bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-white border border-stone-300 dark:border-stone-600 hover:bg-stone-300 dark:hover:bg-stone-600"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
