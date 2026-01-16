'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/providers/ThemeProvider'
import { completeOnboarding, uploadFile } from '@/app/actions/onboarding'
import { THEME_COLORS } from '@/lib/constants/theme-colors'
import { validateCPF, formatCPF, isCPF } from '@/lib/validations/cpf'
import { validateCNPJ, formatCNPJ } from '@/lib/validations/cnpj'
import ThemeSwitcher from '@/components/shared/ThemeSwitcher'
import { FiUpload, FiUser, FiPhone, FiFileText, FiImage, FiCheck } from 'react-icons/fi'
import router from 'next/router'

// 30 Rustic Colors for Menu Theme
const RUSTIC_COLORS = [
  { name: 'Café Escuro', value: '#5C4033' },
  { name: 'Madeira Clara', value: '#8B6F47' },
  { name: 'Terracota', value: '#A0522D' },
  { name: 'Marrom Quente', value: '#8B4513' },
  { name: 'Ouro Velho', value: '#B8860B' },
  { name: 'Siena', value: '#704214' },
  { name: 'Copper', value: '#B87333' },
  { name: 'Chocolate', value: '#6B4423' },
  { name: 'Verde Musgo', value: '#556B2F' },
  { name: 'Verde Floresta', value: '#355E3B' },
  { name: 'Cinza Ardósia', value: '#556B82' },
  { name: 'Pedra Natural', value: '#696969' },
  { name: 'Vinho Tinto', value: '#722F37' },
  { name: 'Bordô', value: '#800020' },
  { name: 'Ocre Dourado', value: '#CC7722' },
  { name: 'Arenito', value: '#A89589' },
  { name: 'Barro Vermelho', value: '#A52A2A' },
  { name: 'Azeite', value: '#808000' },
  { name: 'Cortiça', value: '#9B7653' },
  { name: 'Carvão', value: '#36454F' },
  { name: 'Âmbar Escuro', value: '#AA6C39' },
  { name: 'Terra Queimada', value: '#8A3324' },
  { name: 'Castanha', value: '#654321' },
  { name: 'Oliva Escuro', value: '#6B8E23' },
  { name: 'Bronze Antigo', value: '#8C7853' },
  { name: 'Mogno', value: '#704241' },
  { name: 'Mel Escuro', value: '#C17817' },
  { name: 'Ferrugem', value: '#A0410D' },
  { name: 'Verde Azeitona', value: '#5B6F3A' },
  { name: 'Cobre Envelhecido', value: '#996847' },
]

interface FormData {
  restaurantName: string
  restaurantPhone: string
  ownerName: string
  cpfCnpj: string
  logo: File | null
  cover: File | null
  themeColor: string
}

export default function OnboardingWizard() {
  const router = useRouter()
  const { setThemeColor } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf')

  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    restaurantPhone: '',
    ownerName: '',
    cpfCnpj: '',
    logo: null,
    cover: null,
    themeColor: '#FF6B6B',
  })

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleFileChange = (field: 'logo' | 'cover', file: File | null) => {
    if (!file) return
    
    updateField(field, file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      if (field === 'logo') {
        setLogoPreview(reader.result as string)
      } else {
        setCoverPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handlePaste = (field: 'logo' | 'cover', e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          handleFileChange(field, file)
        }
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'Nome do restaurante é obrigatório'
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Nome do proprietário é obrigatório'
    }
    if (!formData.restaurantPhone.trim()) {
      newErrors.restaurantPhone = 'Telefone é obrigatório'
    }
    if (!formData.cpfCnpj.trim()) {
      newErrors.cpfCnpj = `${documentType === 'cpf' ? 'CPF' : 'CNPJ'} é obrigatório`
    } else {
      const clean = formData.cpfCnpj.replace(/\D/g, '')
      if (documentType === 'cpf') {
        if (clean.length !== 11) {
          newErrors.cpfCnpj = 'CPF deve ter 11 dígitos'
        } else if (!validateCPF(clean)) {
          newErrors.cpfCnpj = 'CPF inválido'
        }
      } else {
        if (clean.length !== 14) {
          newErrors.cpfCnpj = 'CNPJ deve ter 14 dígitos'
        } else if (!validateCNPJ(clean)) {
          newErrors.cpfCnpj = 'CNPJ inválido'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCpfCnpjChange = (value: string) => {
    const clean = value.replace(/\D/g, '')
    const formatted = documentType === 'cpf' ? formatCPF(clean) : formatCNPJ(clean)
    updateField('cpfCnpj', formatted)
  }

  const handleDocumentTypeChange = (type: 'cpf' | 'cnpj') => {
    setDocumentType(type)
    updateField('cpfCnpj', '') // Clear field when changing type
    setErrors(prev => ({ ...prev, cpfCnpj: '' }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Upload logo if provided
      let logoUrl = ''
      if (formData.logo) {
        const result = await uploadFile(formData.logo, 'restaurant-logos', 'logo')
        if (result.success && result.url) {
          logoUrl = result.url
        }
      }

      // Upload cover if provided
      let coverUrl = ''
      if (formData.cover) {
        const result = await uploadFile(formData.cover, 'restaurant-covers', 'cover')
        if (result.success && result.url) {
          coverUrl = result.url
        }
      }

      // Complete onboarding
      const result = await completeOnboarding({
        restaurantName: formData.restaurantName,
        restaurantPhone: formData.restaurantPhone,
        restaurantDescription: '',
        ownerName: formData.ownerName,
        cpfCnpj: formData.cpfCnpj,
        logoUrl,
        coverUrl,
        themeColor: formData.themeColor,
      })

      if (result.success) {
        // Apply theme color
        const colorKey = THEME_COLORS.find(c => c.value === formData.themeColor)?.key || 'red'
        setThemeColor(colorKey)
        
        router.push('/dashboard')
      } else {
        setErrors({ general: result.error || 'Falha ao completar cadastro' })
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      setErrors({ general: 'Ocorreu um erro inesperado' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f8ecdd] via-[#f2d7b5] to-[#e5c39a] dark:from-[#0b1021] dark:via-[#12182a] dark:to-[#0f172a] flex items-center justify-center p-4">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 animate-pulse" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c46c1c' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Orbs with movement */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-700/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <div className="glass px-3 py-2 rounded-xl">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="rounded-3xl p-8 shadow-2xl border-2 border-amber-500/30 bg-white/85 dark:bg-white/5 backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent mb-2">
              Configure seu Restaurante
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              Preencha as informações para começar
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          {/* Color Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.themeColor }} />
              Cor do Cardápio *
            </label>
            <div className="grid grid-cols-15 gap-2 p-4 bg-white/50 dark:bg-white/5 rounded-xl border-2 border-amber-300/30 dark:border-white/10">
              {RUSTIC_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateField('themeColor', color.value)}
                  title={color.name}
                  className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
                    formData.themeColor === color.value
                      ? 'ring-3 ring-offset-2 ring-amber-600 dark:ring-amber-400 scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {formData.themeColor === color.value && (
                    <FiCheck className="text-white drop-shadow-lg" size={16} strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Restaurant Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiFileText className="text-amber-500" />
                  Nome do Restaurante *
                </label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => updateField('restaurantName', e.target.value)}
                  placeholder="Ex: Restaurante do João"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.restaurantName && <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiUser className="text-amber-500" />
                  Nome do Proprietário *
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiPhone className="text-amber-500" />
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={formData.restaurantPhone}
                  onChange={(e) => updateField('restaurantPhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.restaurantPhone && <p className="text-red-500 text-xs mt-1">{errors.restaurantPhone}</p>}
              </div>

              {/* CPF/CNPJ */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiFileText className="text-amber-500" />
                  Documento *
                </label>
                <div className="flex gap-2">
                  {/* Document Type Select */}
                  <select
                    value={documentType}
                    onChange={(e) => handleDocumentTypeChange(e.target.value as 'cpf' | 'cnpj')}
                    className="px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                  
                  {/* Document Number Input */}
                  <input
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={(e) => handleCpfCnpjChange(e.target.value)}
                    placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    maxLength={documentType === 'cpf' ? 14 : 18}
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                {errors.cpfCnpj && <p className="text-red-500 text-xs mt-1">{errors.cpfCnpj}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiImage className="text-amber-500" />
                  Logo do Restaurante
                </label>
                <div
                  onPaste={(e) => handlePaste('logo', e)}
                  className="relative"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300/50 dark:border-white/20 rounded-xl cursor-pointer hover:border-amber-500 transition-all duration-300 bg-white/50 dark:bg-white/5 hover:bg-amber-50/30 dark:hover:bg-white/10 group"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain rounded-xl p-2" />
                    ) : (
                      <>
                        <FiUpload className="text-3xl text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-stone-600 dark:text-stone-400">Clique ou Cole (Ctrl+V)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Cover Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiImage className="text-amber-500" />
                  Imagem de Capa
                </label>
                <div
                  onPaste={(e) => handlePaste('cover', e)}
                  className="relative"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('cover', e.target.files?.[0] || null)}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300/50 dark:border-white/20 rounded-xl cursor-pointer hover:border-amber-500 transition-all duration-300 bg-white/50 dark:bg-white/5 hover:bg-amber-50/30 dark:hover:bg-white/10 group"
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <FiUpload className="text-3xl text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-stone-600 dark:text-stone-400">Clique ou Cole (Ctrl+V)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="group relative w-full md:w-auto px-12 py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-40 blur-xl group-hover:blur-2xl transition-all duration-300" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 animate-pulse" style={{
                backgroundImage: 'linear-gradient(90deg, transparent, white, transparent)',
                backgroundSize: '200% 100%',
              }} />
              
              {/* Button content */}
              <div className="relative flex items-center justify-center gap-3 text-white">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={20} />
                    <span>Finalizar Cadastro</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
