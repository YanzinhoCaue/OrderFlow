"use client"

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiTrash2, FiX } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { deleteCategory } from '@/app/actions/categories'

interface DeleteCategoryButtonProps {
  categoryId: string
  categoryName: string
  dishCount: number
}

export default function DeleteCategoryButton({ categoryId, categoryName, dishCount }: DeleteCategoryButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (dishCount > 0) {
    return null
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory(categoryId)
      if (result?.success) {
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      }
    })
  }

  const modalContent = open && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 border border-red-500/25 rounded-2xl shadow-2xl backdrop-blur-xl p-6 relative">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          aria-label="Fechar"
        >
          <FiX />
        </button>

        <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">Confirmar exclusão</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
          Tem certeza que deseja excluir a categoria <span className="font-semibold">"{categoryName}"</span>? Esta ação não pode ser desfeita.
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className="border-stone-300 text-stone-700 dark:text-stone-200 dark:border-stone-600"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={pending}
            className="bg-red-500 hover:bg-red-600 text-white border border-red-600/70"
          >
            {pending ? 'Deletando...' : 'Deletar'}
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-red-500/80 hover:bg-red-600 text-white border border-red-400/50 text-xs px-3 py-1"
      >
        <FiTrash2 className="w-4 h-4" />
      </Button>

      {mounted && typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}
