'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding, completeCustomerOnboarding } from '@/app/actions/onboarding'
import { validateCPF, formatCPF } from '@/lib/validations/cpf'
import { validateCNPJ, formatCNPJ } from '@/lib/validations/cnpj'
import ThemeSwitcher from '@/components/shared/ThemeSwitcher'
import { FiUser, FiPhone, FiFileText, FiCheck, FiSettings } from 'react-icons/fi'

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
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c46c1c' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Orbs with movement */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-700/20 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out infinite 1s' }} />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <div className="glass px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="space-y-8">
              {/* Logo Area */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <FiSettings className="text-white" size={32} />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#b45309] to-[#f59e0b] dark:from-amber-200 dark:to-amber-500 bg-clip-text text-transparent">
                  iMenuFlow
                </h2>
                <p className="text-lg text-stone-600 dark:text-stone-400">
                  Digitalize seu restaurante
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-white">Cardápio Digital</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Gerencie seus pratos online</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-white">QR Code Inteligente</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Acesso rápido às mesas</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-white">Pedidos em Tempo Real</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">Notificações instantâneas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl p-8 shadow-2xl border-2 border-amber-500/30 bg-white/95 dark:bg-white/5 backdrop-blur-2xl">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
                  Comece agora
                </h1>
                <p className="text-stone-600 dark:text-stone-400">
                  Preencha seus dados para ativar sua plataforma
                </p>
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Section 1: Restaurante */}
                <div className="space-y-4 pb-6 border-b border-stone-200 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Informações do Restaurante</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Nome do Restaurante *
                    </label>
                    <input
                      type="text"
                      value={formData.restaurantName}
                      onChange={(e) => updateField('restaurantName', e.target.value)}
                      placeholder="Ex: Restaurante do João"
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    {errors.restaurantName && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><span>⚠</span> {errors.restaurantName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formData.restaurantPhone}
                      onChange={(e) => updateField('restaurantPhone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    {errors.restaurantPhone && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><span>⚠</span> {errors.restaurantPhone}</p>}
                  </div>
                </div>

                {/* Section 2: Proprietário */}
                <div className="space-y-4 pb-6 border-b border-stone-200 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Dados do Proprietário</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => updateField('ownerName', e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    {errors.ownerName && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><span>⚠</span> {errors.ownerName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Documento *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={documentType}
                        onChange={(e) => handleDocumentTypeChange(e.target.value as 'cpf' | 'cnpj')}
                        className="px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                      </select>
                      
                      <input
                        type="text"
                        value={formData.cpfCnpj}
                        onChange={(e) => handleCpfCnpjChange(e.target.value)}
                        placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                        maxLength={documentType === 'cpf' ? 14 : 18}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    {errors.cpfCnpj && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><span>⚠</span> {errors.cpfCnpj}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full mt-8 relative group px-6 py-4 rounded-xl font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-100 group-hover:opacity-95 transition-opacity" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{
                  backgroundImage: 'linear-gradient(90deg, transparent, white, transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                }} />
                
                {/* Content */}
                <div className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck size={20} className="stroke-current" />
                      <span>Finalizar Cadastro</span>
                    </>
                  )}
                </div>
              </button>

              {/* Footer text */}
              <p className="text-center text-xs text-stone-500 dark:text-stone-400 mt-6">
                Seus dados são protegidos e criptografados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(0px); }
          75% { transform: translateY(-20px) translateX(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: calc(200% + 200px) 0; }
        }
      `}</style>
    </div>
  )
}
