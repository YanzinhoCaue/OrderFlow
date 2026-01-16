"use client"

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiPlus, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { createIngredient, deleteIngredient, getIngredients, updateIngredient } from '@/app/actions/ingredients'
import { cn } from '@/lib/utils/cn'
import ImageUpload from '@/components/ui/ImageUpload'
import { error } from 'console'
import router from 'next/router'

interface IngredientsManagerProps {
  restaurantId: string
  buttonText?: string
  buttonClassName?: string
}

export default function IngredientsManager({
  restaurantId,
  buttonText = 'Gerenciar Ingredientes',
  buttonClassName,
}: IngredientsManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [ingredients, setIngredients] = useState<any[]>([])
  const [namePt, setNamePt] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      loadIngredients()
    }
  }, [open])

  const loadIngredients = async () => {
    const data = await getIngredients(restaurantId)
    setIngredients(data || [])
  }

  const resetForm = () => {
    setNamePt('')
    setPrice('')
    setImageUrl('')
    setEditingId(null)
    setError('')
  }

  const handleEdit = (ingredient: any) => {
    setEditingId(ingredient.id)
    setNamePt(typeof ingredient.name === 'object' ? ingredient.name['pt-BR'] || ingredient.name.en || '' : ingredient.name)
    setPrice(ingredient.price > 0 ? ingredient.price.toString() : '')
    setImageUrl(ingredient.image_url || '')
    setError('')
    
    // Scroll suave para o formulário
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSubmit = () => {
    if (!namePt.trim()) {
      setError('Informe um nome para o ingrediente')
      return
    }

    setError('')
    startTransition(async () => {
      if (editingId) {
        // Update existing ingredient
        const result = await updateIngredient(
          editingId,
          { 'pt-BR': namePt.trim(), en: namePt.trim() },
          price ? parseFloat(price) : 0,
          imageUrl.trim() || undefined
        )

        if (result?.success) {
          resetForm()
          await loadIngredients()
        } else {
          setError('Não foi possível atualizar o ingrediente')
        }
      } else {
        // Create new ingredient
        const result = await createIngredient(
          restaurantId,
          { 'pt-BR': namePt.trim(), en: namePt.trim() },
          price ? parseFloat(price) : 0,
          imageUrl.trim() || undefined
        )

        if (result?.success) {
          resetForm()
          await loadIngredients()
        } else {
          setError('Não foi possível criar o ingrediente')
        }
      }
    })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteIngredient(id)
      
      if (result?.success) {
        setDeleteConfirm(null)
        await loadIngredients()
      } else {
        setError('Não foi possível excluir o ingrediente')
      }
    })
  }

  const modalContent = open && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl relative max-h-[90vh] overflow-hidden flex flex-col">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          aria-label="Fechar"
        >
          <FiX size={24} />
        </button>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 px-6 py-4">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-1">Ingredientes</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">Gerencie os ingredientes disponíveis para seus pratos.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Formulário */}
          <div ref={formRef} className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                {editingId ? 'Editar Ingrediente' : 'Adicionar Novo Ingrediente'}
              </h4>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                >
                  Cancelar edição
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">Nome</label>
                <input
                  value={namePt}
                  onChange={(e) => setNamePt(e.target.value)}
                  className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  placeholder="Ex: Queijo Mozzarella"
                  disabled={pending}
                />
              </div>
              
              <div>
                <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">Preço Base (R$) - Opcional</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  placeholder="0.00"
                  disabled={pending}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">Imagem (Opcional)</label>
              <ImageUpload
                restaurantId={restaurantId}
                currentImageUrl={imageUrl}
                onImageChange={setImageUrl}
                disabled={pending}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={pending}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500/70 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 shadow-md"
            >
              {editingId ? (
                <>
                  <FiEdit2 className="mr-2" />
                  {pending ? 'Atualizando...' : 'Atualizar Ingrediente'}
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  {pending ? 'Adicionando...' : 'Adicionar Ingrediente'}
                </>
              )}
            </Button>
          </div>

          {/* Lista de Ingredientes */}
          <div>
            <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
              Ingredientes Cadastrados ({ingredients.length})
            </h4>
            
            {ingredients.length === 0 ? (
              <div className="text-center py-8 text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-slate-900/30 rounded-lg border border-amber-500/20">
                <p className="text-sm">Nenhum ingrediente cadastrado ainda.</p>
                <p className="text-xs mt-1">Adicione o primeiro ingrediente acima.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/60 border border-amber-500/20 rounded-lg px-4 py-3 hover:border-amber-500/40 transition-colors"
                  >
                    {ingredient.image_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0">
                        <img 
                          src={ingredient.image_url} 
                          alt={typeof ingredient.name === 'object' ? ingredient.name['pt-BR'] : ingredient.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium text-stone-900 dark:text-white">
                        {typeof ingredient.name === 'object' 
                          ? ingredient.name['pt-BR'] || ingredient.name.en || '' 
                          : ingredient.name}
                      </p>
                      {ingredient.price > 0 && (
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                          Preço base: R$ {ingredient.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ingredient)}
                        disabled={pending}
                        className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Editar ingrediente"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(ingredient.id)}
                        disabled={pending}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir ingrediente"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-amber-500/20 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              router.refresh()
            }}
            className="w-full border-stone-300 text-stone-700 dark:text-stone-200 dark:border-stone-600"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  ) : null

  const deleteModal = deleteConfirm && mounted ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-red-500/30 rounded-2xl shadow-2xl backdrop-blur-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <FiTrash2 className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
              Excluir Ingrediente
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Esta ação não pode ser desfeita
            </p>
          </div>
        </div>

        <p className="text-stone-700 dark:text-stone-300 mb-6">
          Tem certeza que deseja excluir este ingrediente? 
          Ele será removido de todos os pratos que o utilizam.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setDeleteConfirm(null)}
            disabled={pending}
            className="border-stone-300 text-stone-700 dark:text-stone-200 dark:border-stone-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm)}
            disabled={pending}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-500/70 hover:from-red-600 hover:to-red-700 shadow-red-500/20 shadow-md"
          >
            {pending ? 'Excluindo...' : 'Sim, Excluir'}
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn(
          'border-amber-500/60 text-amber-700 dark:text-amber-200 hover:border-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-500/10',
          buttonClassName,
        )}
      >
        <FiPlus className="mr-2" />
        {buttonText}
      </Button>

      {mounted && typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
      {mounted && typeof document !== 'undefined' && deleteModal && createPortal(deleteModal, document.body)}
    </>
  )
}
