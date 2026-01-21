"use client"

import { useState, useMemo, useTransition } from 'react'
import { FiDownload, FiRefreshCw } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import NewTableModal from '@/components/dashboard/NewTableModal'
import EditTableModal from '@/components/dashboard/EditTableModal'
import TableSearch from '@/components/dashboard/TableSearch'
import { generateTableQRCode, getTables } from '@/app/actions/tables'

interface Table {
  id: string
  table_number: string
  description?: string
  image_url?: string
  seats_count?: number
  is_active: boolean
  qr_code_url?: string
  qr_code_token: string
}

interface TablesClientProps {
  tables: Table[]
  restaurantId: string
  labels?: {
    title: string
    heading: string
    subtitle: string
    addTable: string
    newQR: string
    downloadQR: string
    previewQR: string
    generating: string
    regenerateQR: string
    noTables: string
  }
}

export default function TablesClient({ tables, restaurantId, labels }: TablesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tablesList, setTablesList] = useState<Table[]>(tables)
  const [isPending, startTransition] = useTransition()
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  const handleRegenerateQRCode = (tableId: string) => {
    setRegeneratingId(tableId)
    startTransition(async () => {
      const result = await generateTableQRCode(tableId)
      if (result.success) {
        // Refetch tables para atualizar a URL do QR code
        const updatedTables = await getTables(restaurantId)
        setTablesList(updatedTables)
      } else {
        alert('Erro ao regenerar QR code: ' + result.error)
      }
      setRegeneratingId(null)
    })
  }

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tablesList

    const query = searchQuery.toLowerCase()
    return tablesList.filter((table) => {
      const matchNumber = table.table_number.toLowerCase().includes(query)
      const matchDescription = table.description?.toLowerCase().includes(query)
      return matchNumber || matchDescription
    })
  }, [tablesList, searchQuery])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">{labels?.heading ?? 'Gestão de espaço'}</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            {labels?.title ?? 'Mesas'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            {labels?.subtitle ?? 'Gerencie as mesas e códigos QR do seu restaurante'}
          </p>
        </div>
        <NewTableModal restaurantId={restaurantId} buttonText={labels?.addTable ?? 'Nova Mesa'} />
      </div>

      {tablesList.length === 0 ? (
        <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
            {labels?.noTables ?? 'Nenhuma mesa cadastrada'}
          </h3>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            {labels?.subtitle ?? 'Crie mesas e gere QR codes para que seus clientes possam fazer pedidos'}
          </p>
          <NewTableModal restaurantId={restaurantId} buttonText={labels?.addTable ?? 'Criar Primeira Mesa'} />
        </div>
      ) : (
        <>
          <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6">
            <TableSearch onSearch={setSearchQuery} />
          </div>

          {filteredTables.length === 0 ? (
            <div className="bg-white/85 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-12 text-center">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
                {labels?.noTables ?? 'Nenhuma mesa encontrada'}
              </h3>
              <p className="text-stone-600 dark:text-stone-400">
                {labels?.subtitle ?? 'Tente outro termo de pesquisa'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTables.map((table) => {
                const tableData = {
                  id: table.id,
                  restaurantId: restaurantId,
                  tableNumber: table.table_number,
                  description: table.description,
                  imageUrl: table.image_url,
                  seatsCount: table.seats_count || 4,
                  isActive: table.is_active,
                  qrCodeUrl: table.qr_code_url,
                  qrCodeToken: table.qr_code_token,
                }
                
                return (
                  <EditTableModal key={table.id} table={tableData}>
                    <div className="group bg-white/90 dark:bg-white/5 border-2 border-amber-500/15 rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:border-amber-400/40 transition-all duration-200 backdrop-blur-xl overflow-hidden cursor-pointer">
                      {table.image_url && (
                        <div className="relative w-full h-48 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 overflow-hidden">
                          <img
                            src={table.image_url}
                            alt={`Mesa ${table.table_number}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border font-medium ${
                                table.is_active
                                  ? 'bg-green-100/90 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/40'
                                  : 'bg-stone-100/90 text-stone-600 border-stone-200 dark:bg-stone-500/20 dark:text-stone-300 dark:border-stone-500/40'
                              }`}
                            >
                              {table.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-stone-900 dark:text-white">
                              Mesa {table.table_number}
                            </h3>
                            {!table.image_url && (
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full mt-2 inline-block border ${
                                  table.is_active
                                    ? 'bg-green-100/80 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-200 dark:border-green-500/30'
                                    : 'bg-stone-100/80 text-stone-600 border-stone-200 dark:bg-stone-500/10 dark:text-stone-300 dark:border-stone-500/30'
                                }`}
                              >
                                {table.is_active ? 'Ativa' : 'Inativa'}
                              </span>
                            )}
                            {table.description && (
                              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                                {table.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {table.qr_code_url && (
                          <div className="bg-white dark:bg-white/95 rounded-xl p-3 border border-amber-500/20">
                            <img
                              key={`${table.id}-${table.qr_code_token}`}
                              src={`${table.qr_code_url}?t=${Date.now()}`}
                              alt={`QR Code Mesa ${table.table_number}`}
                              className="w-full rounded-lg"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRegenerateQRCode(table.id)
                            }}
                            disabled={regeneratingId === table.id || isPending}
                            variant="outline" 
                            size="sm" 
                            className="w-full flex-1 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50"
                            title={labels?.regenerateQR ?? 'Regenerar QR Code'}
                          >
                            <FiRefreshCw className={`mr-2 ${regeneratingId === table.id ? 'animate-spin' : ''}`} />
                            {regeneratingId === table.id ? (labels?.generating ?? 'Gerando...') : (labels?.newQR ?? 'Novo QR')}
                          </Button>
                          {table.qr_code_url && (
                            <a
                              href={table.qr_code_url}
                              download={`mesa-${table.table_number}-qr.png`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                              >
                                <FiDownload className="mr-2" />
                                {labels?.downloadQR ?? 'Baixar QR'}
                              </Button>
                            </a>
                          )}
                        </div>

                        <div className="pt-3 border-t border-amber-500/20">
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                            Token: <span className="font-mono">{table.qr_code_token}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </EditTableModal>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
