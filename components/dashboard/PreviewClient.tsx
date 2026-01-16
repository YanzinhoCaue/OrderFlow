'use client'

import Image from 'next/image'
import { useState } from 'react'
import ColorPicker from '@/components/ui/ColorPicker'
import { FiChevronDown, FiEye, FiBarChart, FiInfo, FiMoon, FiSun, FiCopy, FiCheck, FiPhone, FiMessageCircle, FiInstagram, FiFacebook, FiMoreVertical, FiX } from 'react-icons/fi'

interface PreviewClientProps {
  restaurant: any
  categories: any[]
  dishes: any[]
}

export default function PreviewClient({
  restaurant,
  categories,
  dishes,
}: PreviewClientProps) {
  const [themeColor, setThemeColor] = useState(restaurant?.theme_color || '#FF6B35')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)
  const [expandedDishes, setExpandedDishes] = useState<Record<string, boolean>>({})

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    colorPicker: true,
    statistics: true,
    info: true,
  })

  // Collapsible categories
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  )

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  const handleSaveColor = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/restaurants/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeColor,
        }),
      })

      if (response.ok) {
        setMessage('Cor salva com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Erro ao salvar cor')
      }
    } catch (error) {
      console.error('Erro:', error)
      setMessage('Erro ao salvar cor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyPix = () => {
    if (restaurant?.pix_key) {
      navigator.clipboard.writeText(restaurant.pix_key)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2000)
    }
  }

  const toggleDishExpand = (dishId: string) => {
    setExpandedDishes((prev) => ({ ...prev, [dishId]: !prev[dishId] }))
  }

  const isRestaurantOpen = () => {
    const day = new Date().getDay()
    const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }
    const todayIndex = dayMap[day as keyof typeof dayMap]
    const todayHours = restaurant?.business_hours?.[todayIndex]
    return !todayHours?.closed
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-stone-800 dark:text-stone-100">Visualização do Cardápio</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Mockup */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-sm min-h-96">
              {/* iPhone Frame */}
              <div className="rounded-3xl p-3 shadow-2xl h-full w-full flex flex-col" style={{ minHeight: '700px', backgroundColor: '#000', boxShadow: `0 20px 60px ${themeColor}40` }}>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50" />

                {/* Screen Content */}
                <div className={`flex-1 rounded-2xl overflow-hidden flex flex-col ${isDarkMode ? '!bg-gray-900' : '!bg-white'}`}>
                  {/* Status Bar */}
                  <div className="h-8 border-b flex items-center justify-between px-4 text-xs text-white" style={{ backgroundColor: themeColor }}>
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <span>📶</span>
                      <span>📡</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto flex flex-col">
                    {/* Header */}
                    <div className={`sticky top-0 z-40 ${isDarkMode ? '!bg-gray-900' : '!bg-white'}`}>
                      {/* Cover Image */}
                      {restaurant?.cover_url && (
                        <div className="relative w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200">
                          <Image
                            src={restaurant.cover_url}
                            alt="Cover"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      )}

                      {/* Restaurant Info */}
                      <div className={`px-4 pt-3 pb-2 ${isDarkMode ? '!bg-gray-900' : '!bg-white'}`}>
                        <div className="flex items-start gap-3 mb-2">
                          {restaurant?.logo_url && (
                            <div className="relative w-16 h-16 flex-shrink-0 -mt-8 border-4 rounded-full overflow-hidden shadow-lg bg-white" style={{ borderColor: themeColor }}>
                              <Image
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h1 className={`text-base font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {restaurant?.name}
                              </h1>
                              <div 
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: isRestaurantOpen() ? '#10b981' : '#ef4444' }}
                                title={isRestaurantOpen() ? 'Aberto' : 'Fechado'}
                              />
                            </div>
                            <p className={`text-xs line-clamp-2 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {restaurant?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Categories */}
                    {categories.length > 0 ? (
                      <div className={`${isDarkMode ? '!bg-gray-900' : '!bg-white'}`}>
                        {categories.map((category) => {
                          const categoryDishes = dishes.filter((d) => d.category_id === category.id)
                          const isOpen = openCategories[category.id]

                          return (
                            <div key={category.id} className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                              {/* Category Header */}
                              <button
                                onClick={() => toggleCategory(category.id)}
                                className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                }`}
                              >
                                <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {category.name}
                                </h2>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {categoryDishes.length} {categoryDishes.length === 1 ? 'prato' : 'pratos'}
                                  </span>
                                  <FiChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                      isOpen ? 'rotate-180' : ''
                                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                  />
                                </div>
                              </button>

                              {/* Category Dishes */}
                              {isOpen && categoryDishes.length > 0 && (
                                <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                  {categoryDishes.map((dish) => (
                                    <div
                                      key={dish.id}
                                      className={`px-4 py-3 transition-colors ${
                                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className={`rounded-xl p-3 backdrop-blur-md transition-all border ${
                                        isDarkMode
                                          ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/40 hover:border-gray-600/60'
                                          : 'bg-gradient-to-br from-white/60 to-gray-100/40 border-gray-200/40 hover:border-gray-300/60'
                                      }`}>
                                        <div className="flex gap-3">
                                          {dish.images && dish.images.length > 0 && (
                                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-sm border border-gray-700/20">
                                              <Image
                                                src={dish.images[0]}
                                                alt={dish.name}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                              <h3 className={`font-bold text-sm leading-tight ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                              }`}>
                                                {dish.name}
                                              </h3>
                                              <div
                                                className="text-sm font-bold whitespace-nowrap px-2 py-0.5 rounded-lg"
                                                style={{
                                                  color: themeColor,
                                                  backgroundColor: `${themeColor}15`,
                                                  border: `1px solid ${themeColor}30`
                                                }}
                                              >
                                                R$ {(dish.base_price || 0).toFixed(2)}
                                              </div>
                                            </div>
                                            <p className={`text-xs line-clamp-2 leading-relaxed mb-2 ${
                                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                              {expandedDishes[dish.id] 
                                                ? dish.description 
                                                : dish.description?.substring(0, 80) + (dish.description?.length > 80 ? '...' : '')}
                                            </p>
                                            {dish.description && dish.description.length > 80 && (
                                              <button
                                                onClick={() => toggleDishExpand(dish.id)}
                                                className="text-xs font-semibold transition-colors"
                                                style={{ color: themeColor }}
                                              >
                                                {expandedDishes[dish.id] ? 'Ler menos' : 'Ler mais'}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className={`text-xs text-center px-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Nenhuma categoria disponível
                        </p>
                      </div>
                    )}

                    {/* Footer Info - Futuristic Design */}
                    <div className={`px-3 py-4 space-y-3 border-t backdrop-blur-xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-b from-gray-900/80 to-gray-950/90 border-gray-700/50' 
                        : 'bg-gradient-to-b from-white/90 to-gray-50/95 border-gray-200/50'
                    }`}>
                      {/* Contact Info */}
                      {(restaurant?.restaurant_phone || restaurant?.cpf_cnpj) && (
                        <div className={`rounded-xl p-3 backdrop-blur-md transition-all ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/40 hover:border-gray-600/60' 
                            : 'bg-gradient-to-br from-white/60 to-gray-100/40 border border-gray-200/40 hover:border-gray-300/60'
                        }`}>
                          <p className={`font-bold text-xs mb-2.5 flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            <FiPhone className="w-4 h-4" /> Contato
                          </p>
                          <div className={`space-y-2 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {restaurant?.restaurant_phone && (
                              <a
                                href={`https://wa.me/${restaurant.restaurant_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex justify-between items-center hover:opacity-80 transition"
                              >
                                <span className="font-medium opacity-75">WhatsApp</span>
                                <span className="font-semibold" style={{ color: themeColor }}>
                                  {restaurant.restaurant_phone}
                                </span>
                              </a>
                            )}
                            {restaurant?.cpf_cnpj && (
                              <div className="flex justify-between items-center">
                                <span className="font-medium opacity-75">
                                  {restaurant.cpf_cnpj.length > 14 ? 'CNPJ' : 'CPF'}
                                </span>
                                <span className="font-semibold font-mono text-xs" style={{ color: themeColor }}>
                                  {restaurant.cpf_cnpj}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {restaurant?.business_hours && restaurant.business_hours.length > 0 && (
                        <div className={`rounded-xl p-3 backdrop-blur-md transition-all ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/40 hover:border-gray-600/60' 
                            : 'bg-gradient-to-br from-white/60 to-gray-100/40 border border-gray-200/40 hover:border-gray-300/60'
                        }`}>
                          <p className={`font-bold text-xs mb-2.5 flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            <FiMoreVertical className="w-4 h-4" /> Horário
                          </p>
                          <div className={`space-y-1.5 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {restaurant.business_hours.map((hour: any) => (
                              <div
                                key={hour.day}
                                className="flex justify-between items-center"
                              >
                                <span className="font-medium capitalize opacity-75">
                                  {hour.day.substring(0, 3)}
                                </span>
                                <span 
                                  className="font-semibold"
                                  style={{ color: hour.closed ? '#ef4444' : themeColor }}
                                >
                                  {hour.closed ? '🔴 Fechado' : `${hour.openTime} - ${hour.closeTime}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {restaurant?.payment_settings?.methods && restaurant.payment_settings.methods.length > 0 && (
                        <div className={`rounded-xl p-3 backdrop-blur-md transition-all ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/40 hover:border-gray-600/60' 
                            : 'bg-gradient-to-br from-white/60 to-gray-100/40 border border-gray-200/40 hover:border-gray-300/60'
                        }`}>
                          <p className={`font-bold text-xs mb-2.5 flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            <FiX className="w-4 h-4" /> Pagamento
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {restaurant.payment_settings.methods.map((method: string) => (
                              <span
                                key={method}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-r text-white border-0 shadow-sm hover:shadow-md' 
                                    : 'bg-gradient-to-r text-white border-0 shadow-sm hover:shadow-md'
                                }`}
                                style={{
                                  backgroundImage: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
                                }}
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {restaurant?.pix_key && (
                        <div 
                          className={`rounded-xl p-3 backdrop-blur-md border transition-all ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 hover:border-current' 
                              : 'bg-gradient-to-br from-white/60 to-gray-100/40 hover:border-current'
                          }`}
                          style={{
                            borderColor: `${themeColor}50`,
                            backgroundImage: isDarkMode
                              ? `linear-gradient(135deg, rgba(55,65,81,0.6), rgba(17,24,39,0.4))`
                              : `linear-gradient(135deg, rgba(255,255,255,0.6), rgba(249,250,251,0.4))`
                          }}
                        >
                          <p className={`font-bold text-xs mb-2.5 flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            <FiCopy className="w-4 h-4" /> PIX
                          </p>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`flex-1 px-2.5 py-2 rounded-lg font-mono text-xs break-all backdrop-blur ${
                                isDarkMode 
                                  ? 'bg-gray-950/50 text-gray-100 border border-gray-700/30' 
                                  : 'bg-white/30 text-gray-900 border border-gray-200/30'
                              }`}
                            >
                              {restaurant.pix_key}
                            </div>
                            <button
                              onClick={handleCopyPix}
                              className={`flex-shrink-0 p-2 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
                                copiedPix
                                  ? 'shadow-green-500/50'
                                  : ''
                              }`}
                              style={{ 
                                backgroundColor: copiedPix ? '#10b981' : themeColor,
                                boxShadow: copiedPix 
                                  ? `0 0 12px rgba(16, 185, 129, 0.5)` 
                                  : `0 0 16px ${themeColor}40`
                              }}
                            >
                              {copiedPix ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Social Media - Centered */}
                      {restaurant?.social_media && Object.values(restaurant.social_media).some(v => v) && (
                        <div className={`rounded-xl p-3 backdrop-blur-md transition-all ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/40 hover:border-gray-600/60' 
                            : 'bg-gradient-to-br from-white/60 to-gray-100/40 border border-gray-200/40 hover:border-gray-300/60'
                        }`}>
                          <p className={`font-bold text-xs mb-2.5 flex items-center justify-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            <FiMessageCircle className="w-4 h-4" /> Redes Sociais
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {restaurant.social_media.instagram && (
                              <a
                                href={`https://instagram.com/${restaurant.social_media.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Instagram"
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 hover:from-pink-600 hover:via-rose-500 hover:to-orange-500"
                              >
                                <FiInstagram className="w-4 h-4" />
                              </a>
                            )}
                            {restaurant.social_media.facebook && (
                              <a
                                href={`https://facebook.com/${restaurant.social_media.facebook}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Facebook"
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                              >
                                <FiFacebook className="w-4 h-4" />
                              </a>
                            )}
                            {restaurant.social_media.whatsapp && (
                              <a
                                href={`https://wa.me/${restaurant.social_media.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              >
                                <FiMessageCircle className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer - KRIN.TECH */}
                  <div className={`px-4 py-3 text-center border-t ${
                    isDarkMode 
                      ? 'bg-gray-900/80 border-gray-700/50' 
                      : 'bg-white/80 border-gray-200/50'
                  } backdrop-blur-md`}>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Desenvolvido por <span style={{ 
                        backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'gradientShift 3s ease-in-out infinite'
                      }}>KRIN.TECH</span>
                      <style>{`
                        @keyframes gradientShift {
                          0% { background-position: 0% center; }
                          50% { background-position: 100% center; }
                          100% { background-position: 0% center; }
                        }
                      `}</style>
                    </p>
                  </div>

                  {/* Home Indicator */}
                  <div className="h-6 flex items-end justify-center pb-1" style={{ backgroundColor: '#f9f9f9' }}>
                    <div className="w-32 h-1 rounded-full" style={{ backgroundColor: themeColor }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:w-80 space-y-6">
            {/* Theme Toggle */}
            <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-3">
                Tema do Preview
              </h3>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center justify-between p-3 rounded-lg transition-colors bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10"
              >
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                </span>
                {isDarkMode ? (
                  <FiMoon className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                ) : (
                  <FiSun className="w-5 h-5 text-stone-700 dark:text-stone-300" />
                )}
              </button>
            </div>

            {/* Theme Color Picker */}
            {restaurant && (
              <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('colorPicker')}
                  className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FiEye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">
                        Cor do Cardápio
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        Personalize o tema visual
                      </p>
                    </div>
                  </div>
                  <FiChevronDown
                    className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                      openSections.colorPicker ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.colorPicker && (
                  <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10">
                    <div className="mt-4">
                      <ColorPicker color={themeColor} onChange={setThemeColor} />
                      <button
                        onClick={handleSaveColor}
                        disabled={isSaving}
                        className="w-full mt-4 px-4 py-3 rounded-lg font-semibold text-white transition shadow-lg hover:shadow-xl"
                        style={{
                          backgroundColor: themeColor,
                          opacity: isSaving ? 0.7 : 1,
                        }}
                      >
                        {isSaving ? 'Salvando...' : 'Salvar Cor'}
                      </button>
                      {message && (
                        <p className="text-xs text-green-600 mt-2 text-center font-medium">
                          {message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Statistics */}
            <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('statistics')}
                className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <FiBarChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">
                      Estatísticas
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Visão geral do cardápio
                    </p>
                  </div>
                </div>
                <FiChevronDown
                  className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                    openSections.statistics ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openSections.statistics && (
                <div className="px-6 pb-6 border-t border-amber-500/10">
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="text-center rounded-lg p-4 bg-stone-50 dark:bg-white/5">
                      <p className="text-3xl font-bold text-stone-800 dark:text-stone-100">
                        {categories.length}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-medium">
                        Categorias
                      </p>
                    </div>
                    <div className="text-center rounded-lg p-4 bg-stone-50 dark:bg-white/5">
                      <p className="text-3xl font-bold text-stone-800 dark:text-stone-100">
                        {dishes.length}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-medium">
                        Pratos
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Restaurant Info */}
            {restaurant && (
              <div className="bg-white/80 dark:bg-white/5 border-2 border-amber-500/20 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('info')}
                  className="w-full flex items-center justify-between p-6 hover:bg-amber-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <FiInfo className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">
                        Informações
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        Dados do restaurante
                      </p>
                    </div>
                  </div>
                  <FiChevronDown
                    className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform ${
                      openSections.info ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openSections.info && (
                  <div className="px-6 pb-6 space-y-4 border-t border-amber-500/10">
                    <div className="mt-4 space-y-3 text-sm">
                      {restaurant.restaurant_phone && (
                        <div className="flex justify-between items-center p-3 bg-stone-50 dark:bg-white/5 rounded-lg">
                          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                            Telefone
                          </p>
                          <p className="font-semibold text-stone-900 dark:text-stone-100">
                            {restaurant.restaurant_phone}
                          </p>
                        </div>
                      )}
                      {restaurant.business_hours && restaurant.business_hours.length > 0 && (
                        <div className="flex justify-between items-center p-3 bg-stone-50 dark:bg-white/5 rounded-lg">
                          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                            Status Hoje
                          </p>
                          <p className="font-semibold text-stone-900 dark:text-stone-100">
                            {restaurant.business_hours[new Date().getDay()]?.closed
                              ? '🔴 Fechado'
                              : '🟢 Aberto'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
