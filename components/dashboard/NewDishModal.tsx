"use client"

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiPlus, FiX, FiImage } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { createDish } from '@/app/actions/dishes'
import { getIngredients } from '@/app/actions/ingredients'
import { cn } from '@/lib/utils/cn'
import ImageUpload from '@/components/ui/ImageUpload'
import IngredientAutocomplete from './IngredientAutocomplete'

interface NewDishModalProps {
  restaurantId: string
  categories: Array<{ id: string; name: Record<string, string> }>
  buttonText?: string
  buttonClassName?: string
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

export default function NewDishModal({
  restaurantId,
  categories,
  buttonText = 'Novo Prato',
  buttonClassName,
}: NewDishModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [namePt, setNamePt] = useState('')
  const [descriptionPt, setDescriptionPt] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [isAvailable, setIsAvailable] = useState(true)
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [imageUrl, setImageUrl] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{
    ingredientId: string
    additionalPrice: string
    weight: string
    quantity: string
  }>>([])
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
    if (open) {
      loadIngredients()
    }
  }, [open])

  const loadIngredients = async () => {
    const data = await getIngredients(restaurantId)
    setIngredients(data || [])
  }

  const toggleDay = (day: number) => {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const addIngredient = (ingredientId: string) => {
    setSelectedIngredients([...selectedIngredients, { 
      ingredientId, 
      additionalPrice: '0',
      weight: '',
      quantity: ''
    }])
  }

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...selectedIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedIngredients(updated)
  }

  const resetForm = () => {
    setNamePt('')
    setDescriptionPt('')
    setBasePrice('')
    setCategoryId(categories[0]?.id || '')
    setIsAvailable(true)
    setAvailableDays([0, 1, 2, 3, 4, 5, 6])
    setImageUrl('')
    setSelectedIngredients([])
    setError('')
  }

  const handleSubmit = () => {
    if (!namePt.trim()) {
      setError('Informe um nome para o prato')
      return
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      setError('Informe um preço válido')
      return
    }
    if (!categoryId) {
      setError('Selecione uma categoria')
      return
    }
    if (availableDays.length === 0) {
      setError('Selecione pelo menos um dia da semana')
      return
    }

    setError('')
    startTransition(async () => {
      const result = await createDish({
        restaurantId,
        categoryId,
        name: { 'pt-BR': namePt.trim(), en: namePt.trim() },
        description: descriptionPt.trim() 
          ? { 'pt-BR': descriptionPt.trim(), en: descriptionPt.trim() }
          : undefined,
        basePrice: parseFloat(basePrice),
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
        ingredients: selectedIngredients.map(ing => ({
          ingredientId: ing.ingredientId,
          additionalPrice: parseFloat(ing.additionalPrice) || 0,
          weight: ing.weight.trim() || undefined,
          quantity: ing.quantity.trim() || undefined,
          isOptional: true,
          isRemovable: true,
          isIncludedByDefault: true,
        })),
        isAvailable,
        availableDays,
      })

      if (result?.success) {
        resetForm()
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError(result?.error || 'Não foi possível criar o prato')
      }
    })
  }

  const modalContent = open && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          aria-label="Fechar"
          disabled={pending}
        >
          <FiX size={24} />
        </button>

        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 px-6 py-4 rounded-t-2xl">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-1">Novo Prato</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">Crie um novo prato para sua categoria com todos os detalhes.</p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Categoria e Disponibilidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                disabled={pending}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {typeof cat.name === 'object' ? cat.name['pt-BR'] || cat.name.en || '' : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
                Disponibilidade
              </label>
              <label className="flex items-center space-x-3 px-3 py-2 border border-amber-500/30 dark:border-amber-500/40 rounded-lg cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-500/10 bg-white/80 dark:bg-slate-900/60">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  disabled={pending}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                />
                <span className="text-sm text-stone-700 dark:text-stone-200">Prato disponível</span>
              </label>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
              Nome do Prato
            </label>
            <input
              type="text"
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
              placeholder="Ex: Filé à Parmegiana"
              className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              disabled={pending}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              value={descriptionPt}
              onChange={(e) => setDescriptionPt(e.target.value)}
              placeholder="Descreva o prato..."
              rows={3}
              className="w-full rounded-lg border border-amber-500/20 dark:border-amber-500/30 bg-white/70 dark:bg-slate-900/50 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              disabled={pending}
            />
          </div>

          {/* Preço */}
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
              Preço Base (R$)
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              disabled={pending}
            />
          </div>

          {/* Imagem */}
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
              Imagem do Prato
            </label>
            <ImageUpload
              restaurantId={restaurantId}
              currentImageUrl={imageUrl}
              onImageChange={setImageUrl}
              disabled={pending}
            />
          </div>

          {/* Dias da Semana */}
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-2.5">
              Dias Disponíveis
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  disabled={pending}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    availableDays.includes(day.id)
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md border border-amber-500/50"
                      : "bg-white/80 dark:bg-slate-900/60 text-stone-600 dark:text-stone-300 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-500/10"
                  )}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-2.5">
              Ingredientes
            </label>

            {ingredients.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center bg-white/50 dark:bg-slate-900/30 rounded-lg border border-amber-500/20">
                Nenhum ingrediente cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                <IngredientAutocomplete
                  ingredients={ingredients}
                  onSelect={addIngredient}
                  selectedIds={selectedIngredients.map(s => s.ingredientId)}
                  disabled={pending}
                />

                {selectedIngredients.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {selectedIngredients.map((selected, index) => {
                      const ingredient = ingredients.find(i => i.id === selected.ingredientId)
                      const name = ingredient
                        ? typeof ingredient.name === 'object'
                          ? ingredient.name['pt-BR'] || ingredient.name.en || ''
                          : ingredient.name
                        : ''

                      return (
                        <div key={index} className="bg-white/50 dark:bg-slate-900/30 border border-amber-500/20 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-stone-900 dark:text-white text-sm">
                              {name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              disabled={pending}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <FiX size={18} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">
                                Preço adicional (R$)
                              </label>
                              <input
                                type="number"
                                value={selected.additionalPrice}
                                onChange={(e) => updateIngredient(index, 'additionalPrice', e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-2 py-1.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                disabled={pending}
                              />
                            </div>

                            <div>
                              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">
                                Peso (opcional)
                              </label>
                              <input
                                type="text"
                                value={selected.weight}
                                onChange={(e) => updateIngredient(index, 'weight', e.target.value)}
                                placeholder="Ex: 100g"
                                className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-2 py-1.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                disabled={pending}
                              />
                            </div>

                            <div>
                              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">
                                Qtd (opcional)
                              </label>
                              <input
                                type="text"
                                value={selected.quantity}
                                onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                                placeholder="Ex: 2 unid"
                                className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-2 py-1.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                disabled={pending}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-amber-500/20 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <Button
            variant="outline"
            className="border-stone-300 text-stone-700 dark:text-stone-200 dark:border-stone-600"
            onClick={() => {
              resetForm()
              setOpen(false)
            }}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500/70 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 shadow-md"
          >
            {pending ? 'Criando...' : 'Criar Prato'}
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500/70 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 shadow-md',
          buttonClassName,
        )}
      >
        <FiPlus className="mr-2" />
        {buttonText}
      </Button>

      {mounted && typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}
