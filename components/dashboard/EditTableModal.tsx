"use client"

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { FiX, FiEdit2, FiTrash2, FiDownload, FiPrinter } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import { updateTable, deleteTable, generateTableQRCode } from '@/app/actions/tables'
import { cn } from '@/lib/utils/cn'
import ImageUpload from '@/components/ui/ImageUpload'

interface EditTableModalProps {
  table: {
    id: string
    restaurantId: string
    tableNumber: string
    description?: string
    imageUrl?: string
    seatsCount: number
    isActive: boolean
    qrCodeUrl?: string
    qrCodeToken?: string
  }
  children?: React.ReactNode
}

export default function EditTableModal({ table, children }: EditTableModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [tableNumber, setTableNumber] = useState(table.tableNumber)
  const [description, setDescription] = useState(table.description || '')
  const [imageUrl, setImageUrl] = useState(table.imageUrl || '')
  const [seatsCount, setSeatsCount] = useState(table.seatsCount.toString())
  const [isActive, setIsActive] = useState(table.isActive)
  const [qrCodeUrl, setQrCodeUrl] = useState(table.qrCodeUrl || '')
  
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [generatingQR, setGeneratingQR] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGenerateQR = async () => {
    setGeneratingQR(true)
    setError('')
    try {
      const result = await generateTableQRCode(table.id)
      if (result?.success && result.qrCodeUrl) {
        // Atualiza o estado local imediatamente para mostrar o QR code
        setQrCodeUrl(result.qrCodeUrl)
        // Força refresh da página para atualizar os dados
        router.refresh()
      } else {
        setError(result?.error || 'Erro ao gerar QR Code')
      }
    } catch (err) {
      setError('Erro ao gerar QR Code')
      console.error('QR generation error:', err)
    } finally {
      setGeneratingQR(false)
    }
  }

  const handlePrintQR = async () => {
    if (!qrCodeUrl) {
      setError('Gere o QR Code primeiro')
      return
    }

    // Criar PDF para impressão
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Mesa ${tableNumber} - QR Code</title>
            <style>
              body {
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .container {
                text-align: center;
                max-width: 400px;
              }
              h1 {
                font-size: 48px;
                margin-bottom: 20px;
                color: #292524;
              }
              .qr-code {
                width: 300px;
                height: 300px;
                margin: 20px auto;
                border: 4px solid #d97706;
                border-radius: 16px;
                padding: 20px;
                background: white;
              }
              .qr-code img {
                width: 100%;
                height: 100%;
              }
              .info {
                margin-top: 20px;
                color: #57534e;
                font-size: 14px;
              }
              @media print {
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Mesa ${tableNumber}</h1>
              <div class="qr-code">
                <img src="${qrCodeUrl}" alt="QR Code Mesa ${tableNumber}" />
              </div>
              <div class="info">
                <p><strong>Escaneie o QR Code para fazer seu pedido</strong></p>
                ${description ? `<p>${description}</p>` : ''}
                <p>Capacidade: ${seatsCount} ${parseInt(seatsCount) === 1 ? 'pessoa' : 'pessoas'}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  const handleDelete = () => {
    setError('')
    startTransition(async () => {
      const result = await deleteTable(table.id)

      if (result?.success) {
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError('Não foi possível excluir a mesa')
        setShowDeleteConfirm(false)
      }
    })
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

    setError('')
    startTransition(async () => {
      const result = await updateTable({
        tableId: table.id,
        tableNumber: tableNumber.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        seatsCount: parseInt(seatsCount),
        isActive,
      })

      if (result?.success) {
        setOpen(false)
        setTimeout(() => router.refresh(), 100)
      } else {
        setError('Não foi possível atualizar a mesa')
      }
    })
  }

  if (!mounted) return children || null

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-amber-500/25 rounded-2xl shadow-2xl backdrop-blur-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white">
                {isEditing ? 'Editar Mesa' : `Mesa ${table.tableNumber}`}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    title="Editar mesa"
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
                  {imageUrl && (
                    <div className="relative rounded-lg overflow-hidden h-48 bg-stone-100 dark:bg-stone-800">
                      <img
                        src={imageUrl}
                        alt={`Mesa ${tableNumber}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-white">Mesa {tableNumber}</h3>
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-500/20 rounded-lg p-4">
                      <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">Capacidade</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {seatsCount} {parseInt(seatsCount) === 1 ? 'pessoa' : 'pessoas'}
                      </p>
                    </div>
                  </div>

                  {description && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Descrição</h4>
                      <p className="text-stone-600 dark:text-stone-400">{description}</p>
                    </div>
                  )}

                  {qrCodeUrl && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">QR Code</h4>
                      <div className="bg-white dark:bg-white/95 rounded-xl p-4 border border-amber-500/20 inline-block">
                        <img
                          src={qrCodeUrl}
                          alt={`QR Code Mesa ${tableNumber}`}
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <a
                          href={qrCodeUrl}
                          download={`mesa-${tableNumber}-qr.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-amber-500/30 text-amber-700 dark:text-amber-300"
                          >
                            <FiDownload className="mr-2" />
                            Baixar QR
                          </Button>
                        </a>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handlePrintQR}
                          className="flex-1 border-amber-500/30 text-amber-700 dark:text-amber-300"
                        >
                          <FiPrinter className="mr-2" />
                          Imprimir
                        </Button>
                      </div>
                    </div>
                  )}

                  {!qrCodeUrl && (
                    <Button
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    >
                      {generatingQR ? 'Gerando...' : 'Gerar QR Code'}
                    </Button>
                  )}
                </>
              ) : (
                // Modo de edição
                <>
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
                      restaurantId={table.restaurantId}
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
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <FiTrash2 className="mr-2" />
                  Excluir
                </Button>
              )}
              
              <div className="flex gap-3 ml-auto">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={pending}
                      className="border-stone-300 text-stone-700 dark:text-stone-200"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={pending}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    >
                      {pending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="border-stone-300 text-stone-700 dark:text-stone-200"
                  >
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                  Confirmar exclusão
                </h3>
                <p className="text-stone-600 dark:text-stone-400">
                  Tem certeza que deseja excluir a Mesa {table.tableNumber}? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={pending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {pending ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>,
        document.body
      )}
    </>
  )
}
