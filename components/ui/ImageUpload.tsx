"use client"

import { useState, useRef, useCallback } from 'react'
import { FiUpload, FiX, FiImage } from 'react-icons/fi'
import { uploadDishImage } from '@/app/actions/upload'
import { cn } from '@/lib/utils/cn'

interface ImageUploadProps {
  restaurantId: string
  currentImageUrl?: string
  onImageChange: (url: string) => void
  disabled?: boolean
  className?: string
  uploadFn?: (file: File) => Promise<string | null>
}

export default function ImageUpload({
  restaurantId,
  currentImageUrl,
  onImageChange,
  disabled = false,
  className,
  uploadFn,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState(currentImageUrl || '')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files[0]) {
        await handleFile(files[0])
      }
    },
    [disabled]
  )

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const files = e.target.files
    if (files && files[0]) {
      await handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError('')
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG ou WebP')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Imagem muito grande. Máximo 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase (custom or default)
    setUploading(true)
    try {
      let uploadedUrl: string | null = null

      if (uploadFn) {
        uploadedUrl = await uploadFn(file)
        if (!uploadedUrl) {
          setError('Erro ao fazer upload. Verifique sua conexão.')
          setPreview('')
          setUploading(false)
          return
        }
      } else {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('restaurantId', restaurantId)

        const result = await uploadDishImage(formData)
        if (result.success && result.url) {
          uploadedUrl = result.url
        } else {
          setError(result.error || 'Erro ao fazer upload')
          setPreview('')
          setUploading(false)
          return
        }
      }

      if (uploadedUrl) {
        onImageChange(uploadedUrl)
      } else {
        setPreview('')
        setError('Erro ao fazer upload')
      }
    } catch (err) {
      setError('Erro ao processar a imagem')
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview('')
    onImageChange('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
          dragActive
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed',
          preview ? 'p-2' : 'p-8'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {preview ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                disabled={uploading}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <FiX size={16} />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-sm font-medium">
                  Enviando...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              {uploading ? (
                <div className="animate-spin">
                  <FiUpload size={24} className="text-amber-600" />
                </div>
              ) : (
                <FiImage size={24} className="text-gray-400" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {uploading ? 'Enviando imagem...' : 'Clique ou arraste uma imagem'}
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG ou WebP (máx. 5MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}
