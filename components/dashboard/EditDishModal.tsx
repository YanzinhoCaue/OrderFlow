"use client"

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiX, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { updateDish, deleteDish } from '@/app/actions/dishes'
import { getIngredients } from '@/app/actions/ingredients'
import { cn } from '@/lib/utils/cn'
import ImageUpload from '@/components/ui/ImageUpload'
import IngredientAutocomplete from './IngredientAutocomplete'

interface EditDishModalProps {
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
        imageUrl?: string
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

export default function EditDishModal({
  dish,
  categories,
  children,
}: EditDishModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form states
  const [namePt, setNamePt] = useState(
    typeof dish.name === 'object' ? dish.name['pt-BR'] || dish.name.en || '' : String(dish.name)
  )
  const [descriptionPt, setDescriptionPt] = useState(
    dish.description && typeof dish.description === 'object' 
      ? dish.description['pt-BR'] || dish.description.en || ''
      : ''
  )
  const [basePrice, setBasePrice] = useState(dish.basePrice.toString())
  const [categoryId, setCategoryId] = useState(dish.categoryId)
  const [isAvailable, setIsAvailable] = useState(dish.isAvailable !== false)
  const [availableDays, setAvailableDays] = useState<number[]>(
    dish.availableDays && dish.availableDays.length > 0 
      ? dish.availableDays 
      : [0, 1, 2, 3, 4, 5, 6]
  )
  const [imageUrl, setImageUrl] = useState(
    dish.images && dish.images.length > 0 ? dish.images[0].imageUrl : ''
  )
  const [ingredients, setIngredients] = useState<any[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{
    ingredientId: string
    additionalPrice: string
    weight: string
    quantity: string
  }>>(
    dish.dishIngredients?.map(di => ({
      ingredientId: di.ingredient.id,
      additionalPrice: di.additionalPrice?.toString() || '0',
      weight: '',
      quantity: ''
    })) || []
  )
  
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
    if (open) {
      loadIngredients()
    }
  }, [open])

  const loadIngredients = async () => {
    const data = await getIngredients(dish.restaurantId)
    setIngredients(data || [])
  }

  const toggleDay = (day: number) => {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const addIngredient = (ingredientId: string) => {
    setSelectedIngredients([
      ...selectedIngredients,
      { 
        ingredientId, 
        additionalPrice: '0',
        weight: '',
        quantity: ''
      }
    ])
  }

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...selectedIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedIngredients(updated)
  }

  const handleDelete = () => {
    setError('')
    startTransition(async () => {
      const result = await deleteDish(dish.id)

      if (result?.success) {
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError('Não foi possível excluir o prato')
        setShowDeleteConfirm(false)
      }
    })
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
      const result = await updateDish({
        dishId: dish.id,
        categoryId,
        name: { 'pt-BR': namePt.trim(), en: namePt.trim() },
        description: descriptionPt.trim()
          ? { 'pt-BR': descriptionPt.trim(), en: descriptionPt.trim() }
          : undefined,
        basePrice: parseFloat(basePrice),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
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
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError('Não foi possível atualizar o prato')
      }
    })
  }

  if (!mounted) return children || null

  const dishName = typeof dish.name === 'object' ? dish.name['pt-BR'] || dish.name.en : dish.name
  const dishDescription = dish.description && typeof dish.description === 'object' 
    ? (dish.description['pt-BR'] || dish.description.en || '')
    : (dish.description as unknown as string | null)

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white">
                {isEditing ? 'Editar Prato' : dishName}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    title="Editar prato"
                  >
                    <FiEdit2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setOpen(false)
                    setIsEditing(false)
                  }}
                  className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  disabled={pending}
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {!isEditing ? (
                // Modo de visualização
                <>
                  {dish.images && dish.images.length > 0 && (
                    <div className="relative rounded-lg overflow-hidden h-64 bg-stone-100 dark:bg-stone-800">
                      <img
                        src={dish.images[0].imageUrl}
                        alt={dishName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{dishName}</h3>
                    <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                      R$ {dish.basePrice.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${dish.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-stone-600 dark:text-stone-400">
                      {dish.isAvailable ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>

                  {dishDescription && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Descrição</h4>
                      <p className="text-stone-600 dark:text-stone-400">{dishDescription}</p>
                    </div>
                  )}

                  {dish.dishIngredients && dish.dishIngredients.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Ingredientes</h4>
                      <div className="space-y-2">
                        {dish.dishIngredients.map((ing, idx) => {
                          if (!ing.ingredient) return null
                          
                          const ingName = typeof ing.ingredient.name === 'object'
                            ? ing.ingredient.name['pt-BR'] || ing.ingredient.name.en || 'Ingrediente'
                            : ing.ingredient.name || 'Ingrediente'
                          
                          return (
                            <div key={ing.id || idx} className="flex items-center gap-3 p-2 bg-white/80 dark:bg-stone-800/50 rounded-lg border border-amber-500/20">
                              {ing.ingredient.imageUrl && (
                                <div className="w-12 h-12 rounded-md bg-stone-100 dark:bg-stone-900 overflow-hidden flex-shrink-0">
                                  <img
                                    src={ing.ingredient.imageUrl}
                                    alt={ingName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900 dark:text-white">
                                  {ingName}
                                </p>
                              </div>
                              {ing.additionalPrice > 0 && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                                  +R$ {ing.additionalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

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

                </>
              ) : (
                // Modo de edição
                <>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Categoria e Disponibilidade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        Categoria
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-4 py-2 border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disponibilidade
                  </label>
                  <label className="flex items-center space-x-3 px-4 py-2 border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-slate-800/80">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      disabled={pending}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-amber-500/30 dark:border-amber-500/40 rounded"
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-300">Prato disponível</span>
                  </label>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Nome do Prato
                </label>
                <input
                  type="text"
                  value={namePt}
                  onChange={(e) => setNamePt(e.target.value)}
                  placeholder="Ex: Filé à Parmegiana"
                  className="w-full px-4 py-2 border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={pending}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descriptionPt}
                  onChange={(e) => setDescriptionPt(e.target.value)}
                  placeholder="Descreva o prato..."
                  rows={3}
                  className="w-full px-4 py-2 border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  disabled={pending}
                />
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Preço Base (R$)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={pending}
                />
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Imagem do Prato
                </label>
                <ImageUpload
                  restaurantId={dish.restaurantId}
                  currentImageUrl={imageUrl}
                  onImageChange={setImageUrl}
                  disabled={pending}
                />
              </div>

              {/* Dias da Semana */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
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
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
                      )}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                  Ingredientes
                </label>

                {ingredients.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center bg-stone-50 dark:bg-stone-800/50 rounded-lg">
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
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 border-t border-amber-500/20 px-6 py-4 flex justify-between gap-3 rounded-b-2xl">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={pending}
                  className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-700"
                >
                  <FiTrash2 className="mr-2" />
                  Excluir Prato
                </Button>
              )}
              
              <div className="flex gap-3 ml-auto">
                {isEditing && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                )}
                {isEditing ? (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={pending}
                  >
                    {pending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setOpen(false)
                      setIsEditing(false)
                    }}
                    className="bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-white border border-stone-300 dark:border-stone-600 hover:bg-stone-300 dark:hover:bg-stone-600"
                  >
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmação de Exclusão */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-red-500/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <FiTrash2 className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                  Excluir Prato
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>

            <p className="text-stone-700 dark:text-stone-300 mb-6">
              Tem certeza que deseja excluir <strong>{namePt}</strong>? 
              Todas as informações, imagens e ingredientes associados serão removidos permanentemente.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={pending}
                className="border-stone-300 text-stone-700 dark:text-stone-200 dark:border-stone-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={pending}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-500/70 hover:from-red-600 hover:to-red-700 shadow-red-500/20 shadow-md"
              >
                {pending ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
