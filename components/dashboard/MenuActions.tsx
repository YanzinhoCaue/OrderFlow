"use client"

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiPlus, FiX } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { createCategory } from '@/app/actions/categories'
import { cn } from '@/lib/utils/cn'

interface MenuActionsProps {
  restaurantId: string
  buttonText?: string
  buttonClassName?: string
}

export default function MenuActions({ restaurantId, buttonText = 'Categoria', buttonClassName }: MenuActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [namePt, setNamePt] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetForm = () => {
    setNamePt('')
    setDescription('')
    setError('')
  }

  const handleSubmit = () => {
    if (!namePt.trim()) {
      setError('Informe um nome para a categoria')
      return
    }
    setError('')
    startTransition(async () => {
      const result = await createCategory(
        restaurantId,
        { 'pt-BR': namePt.trim(), en: namePt.trim() },
        description.trim() ? { 'pt-BR': description.trim(), en: description.trim() } : undefined
      )
      if (result?.success) {
        resetForm()
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError('Não foi possível criar a categoria')
      }
    })
  }

  const modalContent = open && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl p-6 relative">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          aria-label="Fechar"
        >
          <FiX />
        </button>

        <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-1">Nova categoria</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">Crie uma categoria para organizar seus pratos.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">Nome (pt-BR)</label>
            <input
              value={namePt}
              onChange={(e) => setNamePt(e.target.value)}
              className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              placeholder="Ex: Entradas"
            />
          </div>
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-amber-500/20 dark:border-amber-500/30 bg-white/70 dark:bg-slate-900/50 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              rows={3}
              placeholder="Resumo curto"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className="border-stone-300 text-stone-700 dark:text-stone-200 dark:border-stone-600"
            onClick={() => {
              resetForm()
              setOpen(false)
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500/70 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20 shadow-md"
          >
            {pending ? 'Salvando...' : 'Salvar'}
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
    </>
  )
}
