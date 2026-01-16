'use client'

import { useState } from 'react'
import { FiSave, FiUser, FiSmartphone, FiImage, FiChevronDown, FiClock, FiDollarSign, FiShare2 } from 'react-icons/fi'
import ImageUpload from '@/components/ui/ImageUpload'
import BusinessHours, { BusinessHour } from '@/components/ui/BusinessHours'
import SocialMedia, { SocialMediaLinks } from '@/components/ui/SocialMedia'
import PaymentMethods, { PaymentSettings } from '@/components/ui/PaymentMethods'
import { formatCPF } from '@/lib/validations/cpf'
import { formatCNPJ } from '@/lib/validations/cnpj'

const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '')
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

type Profile = {
  id: string
  full_name?: string | null
  cpf_cnpj?: string | null
  phone?: string | null
}

type Restaurant = {
  id: string
  name: string
  phone: string | null
  description: string | null
  logo_url: string | null
  cover_url: string | null
  theme_color: string
}

const RUSTIC_COLORS = [
  '#5C4033', '#A0522D', '#B8860B', '#8B4513', '#B87333', '#6B4423', '#722F37', '#CC7722',
  '#556B2F', '#355E3B', '#556B82', '#36454F', '#AA6C39', '#8A3324', '#654321', '#996847',
]

export default function SettingsClient({
  restaurant,
  profile,
}: {
  restaurant: Restaurant
  profile: Profile
}) {
  console.log('[SettingsClient] restaurant:', restaurant)
  console.log('[SettingsClient] restaurant.id:', restaurant.id, 'type:', typeof restaurant.id)
  
  const [formData, setFormData] = useState({
    restaurantName: restaurant.name,
    restaurantPhone: restaurant.phone || '',
    description: restaurant.description || '',
    themeColor: restaurant.theme_color || '#B8860B',
    logoUrl: restaurant.logo_url || '',
    coverUrl: restaurant.cover_url || '',
    ownerName: profile.full_name || '',
    ownerPhone: profile.phone || '',
    cpfCnpj: profile.cpf_cnpj || '',
    documentType: (profile.cpf_cnpj && profile.cpf_cnpj.replace(/\D/g, '').length > 11) ? 'cnpj' : 'cpf',
    businessHours: (restaurant.business_hours && Array.isArray(restaurant.business_hours)) 
      ? restaurant.business_hours 
      : [
        { day: 'monday', openTime: '09:00', closeTime: '23:00', closed: false },
        { day: 'tuesday', openTime: '09:00', closeTime: '23:00', closed: false },
        { day: 'wednesday', openTime: '09:00', closeTime: '23:00', closed: false },
        { day: 'thursday', openTime: '09:00', closeTime: '23:00', closed: false },
        { day: 'friday', openTime: '09:00', closeTime: '23:00', closed: false },
        { day: 'saturday', openTime: '10:00', closeTime: '23:00', closed: false },
        { day: 'sunday', openTime: '10:00', closeTime: '22:00', closed: false },
      ],
    socialMedia: (restaurant.social_media && typeof restaurant.social_media === 'object')
      ? restaurant.social_media
      : {
        instagram: '',
        facebook: '',
        whatsapp: '',
        twitter: '',
        tiktok: '',
      },
    paymentSettings: (restaurant.payment_settings && typeof restaurant.payment_settings === 'object')
      ? { ...restaurant.payment_settings, pixKey: restaurant.pix_key || '' }
      : {
        methods: [],
        serviceFee: 10,
        serviceFeetype: 'percentage' as 'percentage' | 'fixed',
        acceptsCash: true,
        pixKey: restaurant.pix_key || '',
      },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    identity: true,
    branding: true,
    owner: true,
    hours: false,
    social: false,
    payments: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleChange = (field: string, value: string | BusinessHour[] | SocialMediaLinks | PaymentSettings) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCpfCnpjChange = (value: string) => {
    const clean = value.replace(/\D/g, '')
    const formatted = clean.length > 11 ? formatCNPJ(clean) : formatCPF(clean)
    handleChange('cpfCnpj', formatted)
  }

  const handlePhoneChange = (field: string, value: string) => {
    const formatted = formatPhone(value)
    handleChange(field, formatted)
  }

  const uploadBrandImage = async (file: File, type: 'logo' | 'cover') => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('restaurantId', restaurant.id)
      fd.append('type', type)

      console.log('Iniciando upload de', type, 'para restaurante', restaurant.id)

      const res = await fetch('/api/uploads/brand', {
        method: 'POST',
        body: fd,
      })

      console.log('Resposta status:', res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Upload error status:', res.status, res.statusText)
        console.error('Upload error response:', errorText)
        try {
          const errorJson = JSON.parse(errorText)
          console.error('Upload error JSON:', errorJson)
        } catch (e) {
          console.error('Could not parse error as JSON')
        }
        return null
      }

      const data = await res.json()
      console.log('Upload sucesso:', data)
      return data.url as string
    } catch (error) {
      console.error('Upload exception:', error)
      return null
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/restaurants/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: formData.restaurantName,
          restaurantPhone: formData.restaurantPhone,
          description: formData.description,
          themeColor: formData.themeColor,
          logoUrl: formData.logoUrl,
          coverUrl: formData.coverUrl,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          cpfCnpj: formData.cpfCnpj,
          businessHours: formData.businessHours,
          socialMedia: formData.socialMedia,
          paymentSettings: formData.paymentSettings,
        }),
      })

      if (!response.ok) {
        setMessage('Erro ao salvar alterações')
        return
      }

      const updated = await response.json()
      setMessage('Configurações salvas com sucesso')
      window.scrollTo(0, 0)
      setFormData((prev) => ({
        ...prev,
        restaurantName: updated.restaurant.name,
        restaurantPhone: updated.restaurant.phone || '',
        description: updated.restaurant.description || '',
        themeColor: updated.restaurant.theme_color,
        logoUrl: updated.restaurant.logo_url || '',
        coverUrl: updated.restaurant.cover_url || '',
        ownerName: updated.profile.full_name || '',
        ownerPhone: updated.profile.phone || '',
        cpfCnpj: updated.profile.cpf_cnpj || '',
      }))
    } catch (error) {
      setMessage('Erro inesperado ao salvar')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-sm text-stone-600 dark:text-stone-400">Gestão de configurações</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] dark:from-amber-200 dark:via-amber-400 dark:to-orange-500 bg-clip-text text-transparent">
            Configurações do Restaurante
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            Mesmas opções do cadastro para atualizar dados e identidade visual
          </p>
        </div>
        <button
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-60"
        >
          <FiSave className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {message && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identidade do restaurante */}
        <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('identity')}
            className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-stone-800 dark:text-white">
              <FiImage className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Identidade do restaurante</h2>
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                openSections.identity ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.identity && (
            <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => handleChange('restaurantName', e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Telefone *</label>
                  <input
                    type="tel"
                    value={formData.restaurantPhone}
                    onChange={(e) => handlePhoneChange('restaurantPhone', e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Branding */}
        <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('branding')}
            className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-stone-800 dark:text-white">
              <FiImage className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Logo, capa e cores</h2>
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                openSections.branding ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.branding && (
            <div className="px-6 pb-6 space-y-6 border-t border-amber-500/10 mt-0 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Logo</p>
                  <ImageUpload
                    restaurantId={restaurant.id}
                    currentImageUrl={formData.logoUrl}
                    uploadFn={(file) => uploadBrandImage(file, 'logo')}
                    onImageChange={(url) => handleChange('logoUrl', url)}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Capa</p>
                  <ImageUpload
                    restaurantId={restaurant.id}
                    currentImageUrl={formData.coverUrl}
                    uploadFn={(file) => uploadBrandImage(file, 'cover')}
                    onImageChange={(url) => handleChange('coverUrl', url)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dados do responsável */}
        <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('owner')}
            className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-stone-800 dark:text-white">
              <FiUser className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Dados do responsável</h2>
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                openSections.owner ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.owner && (
            <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10 mt-0 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Telefone</label>
                  <div className="relative">
                    <FiSmartphone className="absolute left-3 top-3 text-stone-400" />
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => handlePhoneChange('ownerPhone', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Documento *</label>
                <div className="flex gap-2 mb-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition" style={{
                    borderColor: formData.documentType === 'cpf' ? '#F59E0B' : '#D1D5DB',
                    backgroundColor: formData.documentType === 'cpf' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                  }}>
                    <input
                      type="radio"
                      name="documentType"
                      value="cpf"
                      checked={formData.documentType === 'cpf'}
                      onChange={(e) => handleChange('documentType', e.target.value)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">CPF</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition" style={{
                    borderColor: formData.documentType === 'cnpj' ? '#F59E0B' : '#D1D5DB',
                    backgroundColor: formData.documentType === 'cnpj' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                  }}>
                    <input
                      type="radio"
                      name="documentType"
                      value="cnpj"
                      checked={formData.documentType === 'cnpj'}
                      onChange={(e) => handleChange('documentType', e.target.value)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">CNPJ</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder={formData.documentType === 'cpf' ? '123.456.789-00' : '12.345.678/0001-90'}
                  value={formData.cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white placeholder-stone-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Horário de funcionamento */}
        <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('hours')}
            className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-stone-800 dark:text-white">
              <FiClock className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Horário de funcionamento</h2>
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                openSections.hours ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.hours && (
            <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10 mt-0 pt-6">
              <BusinessHours
                hours={formData.businessHours}
                onChange={(hours) => handleChange('businessHours', hours)}
              />
            </div>
          )}
        </div>

        {/* Redes sociais */}
        <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('social')}
            className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-stone-800 dark:text-white">
              <FiShare2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Redes sociais</h2>
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                openSections.social ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.social && (
            <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10 mt-0 pt-6">
              <SocialMedia
                links={formData.socialMedia}
                onChange={(links) => handleChange('socialMedia', links)}
              />
            </div>
          )}
        </div>

        {/* Formas de pagamento e taxas */}
        <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('payments')}
            className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 text-stone-800 dark:text-white">
              <FiDollarSign className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Formas de pagamento e taxas</h2>
            </div>
            <FiChevronDown
              className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                openSections.payments ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.payments && (
            <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10 mt-0 pt-6">
              <PaymentMethods
                settings={formData.paymentSettings}
                onChange={(settings) => handleChange('paymentSettings', settings)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-60"
          >
            <FiSave className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
