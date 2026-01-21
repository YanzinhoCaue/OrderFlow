'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, completeCustomerOnboarding } from '@/app/actions/onboarding'
import { validateCPF, formatCPF } from '@/lib/validations/cpf'
import { validateCNPJ, formatCNPJ } from '@/lib/validations/cnpj'
import ThemeSwitcher from '@/components/shared/ThemeSwitcher'
import { FiUser, FiPhone, FiFileText, FiCheck, FiShoppingBag, FiSettings } from 'react-icons/fi'

interface FormData {
  userType: 'customer' | 'owner'
  // Owner fields
  restaurantName: string
  restaurantPhone: string
  ownerName: string
  cpfCnpj: string
  // Customer fields
  fullName: string
  address: string
}

export default function OnboardingWizard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf')
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Get redirect URL from localStorage on mount
  useEffect(() => {
    const storedRedirect = localStorage.getItem('oauth_redirect')
    if (storedRedirect) {
      setRedirectUrl(storedRedirect)
      localStorage.removeItem('oauth_redirect')
    }
  }, [])

  const [formData, setFormData] = useState<FormData>({
    userType: 'owner',
    // owner defaults
    restaurantName: '',
    restaurantPhone: '',
    ownerName: '',
    cpfCnpj: '',
    // customer defaults
    fullName: '',
    address: '',
  })

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.userType === 'owner') {
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
    } else {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Nome completo é obrigatório'
      }
      if (!formData.restaurantPhone.trim()) {
        newErrors.restaurantPhone = 'Telefone é obrigatório'
      }
      const clean = formData.cpfCnpj.replace(/\D/g, '')
      if (clean.length !== 11) {
        newErrors.cpfCnpj = 'CPF deve ter 11 dígitos'
      } else if (!validateCPF(clean)) {
        newErrors.cpfCnpj = 'CPF inválido'
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
      if (formData.userType === 'owner') {
        // Complete onboarding for owner (create restaurant)
        const result = await completeOnboarding({
          restaurantName: formData.restaurantName,
          restaurantPhone: formData.restaurantPhone,
          restaurantDescription: '',
          ownerName: formData.ownerName,
          cpfCnpj: formData.cpfCnpj,
          logoUrl: '',
          coverUrl: '',
          themeColor: '#FF6B35',
        })

        if (result.success) {
          router.push('/dashboard')
        } else {
          console.error('Owner onboarding failed:', result.error)
          setErrors({ general: result.error || 'Falha ao completar cadastro' })
        }
      } else {
        // Complete onboarding for customer (profile only)
        console.log('Submitting customer onboarding:', { fullName: formData.fullName, phone: formData.restaurantPhone })
        const result = await completeCustomerOnboarding({
          fullName: formData.fullName,
          cpf: formData.cpfCnpj,
          phone: formData.restaurantPhone,
          address: formData.address,
        })
        console.log('Customer onboarding result:', result)
        if (result.success) {
          // Use redirectUrl if available (from QR code flow), otherwise go to /menu
          const finalRedirect = redirectUrl || '/menu'
          router.push(finalRedirect)
        } else {
          console.error('Customer onboarding failed:', result.error)
          setErrors({ general: result.error || 'Falha ao completar cadastro' })
        }
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
              Faça seu cadastro
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

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
              Você é: *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateField('userType', 'owner')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  formData.userType === 'owner'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10'
                    : 'border-amber-300/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-amber-400'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-full ${
                    formData.userType === 'owner'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 dark:bg-white/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    <FiSettings size={22} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-stone-800 dark:text-stone-100">Proprietário</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Gerenciar restaurante</p>
                  </div>
                  {formData.userType === 'owner' && (
                    <FiCheck className="text-amber-500" size={20} strokeWidth={3} />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => { updateField('userType', 'customer'); setDocumentType('cpf') }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  formData.userType === 'customer'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10'
                    : 'border-amber-300/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-amber-400'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-full ${
                    formData.userType === 'customer'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 dark:bg-white/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    <FiShoppingBag size={22} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-stone-800 dark:text-stone-100">Cliente</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">Fazer pedidos</p>
                  </div>
                  {formData.userType === 'customer' && (
                    <FiCheck className="text-amber-500" size={20} strokeWidth={3} />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Form */}
          {formData.userType === 'owner' ? (
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
                    title="Tipo de documento"
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
          ) : (
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiUser className="text-amber-500" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
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

              {/* CPF */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiFileText className="text-amber-500" />
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder={'000.000.000-00'}
                  maxLength={14}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.cpfCnpj && <p className="text-red-500 text-xs mt-1">{errors.cpfCnpj}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  <FiFileText className="text-amber-500" />
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

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
