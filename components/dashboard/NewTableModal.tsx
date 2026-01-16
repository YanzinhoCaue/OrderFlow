"use client"

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiPlus, FiX, FiImage, FiPrinter } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { createTable } from '@/app/actions/tables'
import { cn } from '@/lib/utils/cn'
import ImageUpload from '@/components/ui/ImageUpload'

interface NewTableModalProps {
  restaurantId: string
  buttonText?: string
  buttonClassName?: string
}

export default function NewTableModal({
  restaurantId,
  buttonText = 'Nova Mesa',
  buttonClassName,
}: NewTableModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [seatsCount, setSeatsCount] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetForm = () => {
    setTableNumber('')
    setDescription('')
    setImageUrl('')
    setSeatsCount('')
    setIsActive(true)
    setError('')
  }

  const handleSubmit = () => {
    if (!tableNumber.trim()) {
      setError('Informe o número da mesa')
      return
    }
    if (!seatsCount || parseInt(seatsCount) <= 0) {
      setError('Informe um número válido de cadeiras')
      return
    }

    console.log('Submitting table:', {
      restaurantId,
      tableNumber: tableNumber.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      seatsCount: parseInt(seatsCount),
      isActive,
    })

    setError('')
    startTransition(async () => {
      const result = await createTable({
        restaurantId,
        tableNumber: tableNumber.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        seatsCount: parseInt(seatsCount),
        isActive,
      })

      console.log('Create table result:', result)

      if (result?.success) {
        resetForm()
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError(result?.error || 'Não foi possível criar a mesa')
      }
    })
  }

  const modalContent = open && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          aria-label="Fechar"
          disabled={pending}
        >
          <FiX size={24} />
        </button>

        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 px-6 py-4 rounded-t-2xl">
          <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-1">Nova Mesa</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">Cadastre uma nova mesa no seu restaurante.</p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
                Número da Mesa
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 1, A1, VIP-01"
                className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                disabled={pending}
              />
            </div>

            <div>
              <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
                Número de Cadeiras
              </label>
              <input
                type="number"
                value={seatsCount}
                onChange={(e) => setSeatsCount(e.target.value)}
                placeholder="Ex: 4"
                min="1"
                className="w-full rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                disabled={pending}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mesa próxima à janela, ótima vista..."
              rows={3}
              className="w-full rounded-lg border border-amber-500/20 dark:border-amber-500/30 bg-white/70 dark:bg-slate-900/50 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              disabled={pending}
            />
          </div>

          <div>
            <label className="text-xs text-stone-600 dark:text-stone-400 block mb-1.5">
              Imagem da Mesa (opcional)
            </label>
            <ImageUpload
              restaurantId={restaurantId}
              currentImageUrl={imageUrl}
              onImageChange={setImageUrl}
              disabled={pending}
            />
          </div>

          <div>
            <label className="flex items-center space-x-3 px-3 py-2 border border-amber-500/30 dark:border-amber-500/40 rounded-lg cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-500/10 bg-white/80 dark:bg-slate-900/60">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={pending}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
              />
              <span className="text-sm text-stone-700 dark:text-stone-200">Mesa ativa</span>
            </label>
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
            {pending ? 'Criando...' : 'Criar Mesa'}
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
