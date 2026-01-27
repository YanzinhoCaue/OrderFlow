'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { signOut } from '@/app/actions/auth'
import { submitMenuOrder } from '@/app/actions/menu-orders'
import { FiLogOut, FiMoon, FiSun, FiChevronDown, FiPhone, FiMoreVertical, FiCopy, FiInstagram, FiTwitter, FiLinkedin, FiYoutube, FiFacebook, FiShoppingCart, FiX, FiMinus, FiPlus, FiBell, FiStar } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useTranslation } from '@/components/providers/I18nProvider'
import { SUPPORTED_LOCALES } from '@/lib/constants/locales'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface MenuPageClientProps {
  user: any
  table?: any
  restaurant: any
  categories: any[]
  dishes: any[]
}

export default function MenuPageClient({ user, table, restaurant, categories, dishes }: MenuPageClientProps) {
  const { theme, toggleTheme } = useTheme()
  const { t, locale, setLocale } = useTranslation()
  const themeColor = restaurant?.theme_color || '#FF6B35'

  // Helper function to extract localized value from JSON object
  const getLocalizedValue = (value: any, fallback: string = ''): string => {
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null) {
      return value[locale] || value['pt-BR'] || Object.values(value)[0] || fallback
    }
    return fallback
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--menu-theme', themeColor)
    }
  }, [themeColor])

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    (categories || []).reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {} as Record<string, boolean>)
  )
  const [expandedDishes, setExpandedDishes] = useState<Record<string, boolean>>({})
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [selectedDish, setSelectedDish] = useState<any>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, number>>({})
  const [cart, setCart] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 88, left: 0 })
  const [lastOrderId, setLastOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastOrderId')
    }
    return null
  })
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewPendingOrderId, setReviewPendingOrderId] = useState<string | null>(null)
  const [reviewScores, setReviewScores] = useState({ dish: 0, waiter: 0, restaurant: 0 })
  const [reviewComments, setReviewComments] = useState({ dish: '', waiter: '', restaurant: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [lastOrderDishIds, setLastOrderDishIds] = useState<string[]>([])
  const [lastOrderDishNames, setLastOrderDishNames] = useState<string[]>([])
  const [ratedOrders, setRatedOrders] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem('rated-orders') || '{}')
    } catch (err) {
      console.error('Erro ao carregar avaliações já enviadas:', err)
      return {}
    }
  })

  // Monitorar notificações em tempo real (usando tabela notifications como Kitchen/Waiter)
  useEffect(() => {
    if (!lastOrderId) {
      console.log('⏳ Aguardando ID do pedido...')
      return
    }

    console.log('🔌 [CLIENTE] Conectando ao Realtime para notificações do pedido:', lastOrderId)
    
    const supabase = createClient()
    
    // Subscribe to notifications table (instead of orders) - same as Kitchen/Waiter
    const channel = supabase
      .channel(`customer-notifications-${lastOrderId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `order_id=eq.${lastOrderId}`,
        },
        (payload: any) => {
          const data = payload as any
          console.log('📨 [CLIENTE] Notificação recebida do Realtime:', data)
          console.log('   - Target:', data.new?.target)
          console.log('   - Type:', data.new?.type)
          console.log('   - Message:', data.new?.message)
          
          const notification = data.new
          
          // Filter only customer notifications
          if (notification.target === 'customer') {
            console.log('✅ [CLIENTE] Notificação é para cliente, processando...')
            const newNotification = {
              id: notification.id,
              title: notification.type === 'accepted'
                ? t('publicMenu.notification.accepted')
                : notification.type === 'ready'
                ? t('publicMenu.notification.ready')
                : notification.type === 'cancelled'
                ? t('publicMenu.notification.cancelled')
                : t('publicMenu.notification.info'),
              message: notification.message,
              timestamp: new Date(notification.created_at),
              type: notification.type,
            }
            setNotifications(prev => {
              const updated = [newNotification, ...prev]
              console.log('📬 [CLIENTE] Notificação adicionada. Total:', updated.length)
              return updated
            })
            console.log(`📬 [CLIENTE] Notificação ${notification.type} exibida para cliente`)
          } else {
            console.log('⚠️ [CLIENTE] Notificação não é para cliente (target:', notification.target, '), ignorando')
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 [CLIENTE] Realtime status:', status)
      })

    return () => {
      console.log('🔌 [CLIENTE] Desconectando Realtime de notificações')
      supabase.removeChannel(channel)
    }
  }, [lastOrderId])

  // Monitorar mudança de status do pedido para abrir avaliação ao entregar
  useEffect(() => {
    if (!lastOrderId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`customer-order-status-${lastOrderId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${lastOrderId}`,
        },
        (payload: any) => {
          const data = payload as any
          const nextStatus = data.new?.status
          if (nextStatus === 'delivered') {
            console.log('📦 [CLIENTE] Pedido marcado como entregue - abrindo avaliação')
            handleDeliveredStatus(lastOrderId)
          }
        }
      )
      .subscribe((status) => console.log('🔌 [CLIENTE] Status da subscrição de pedido:', status))

    return () => {
      console.log('🔌 [CLIENTE] Desconectando Realtime do pedido')
      supabase.removeChannel(channel)
    }
  }, [lastOrderId, ratedOrders])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNotifications && !target.closest('.notification-dropdown')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const updateDropdownPosition = () => {
    if (!notificationButtonRef.current) return
    const rect = notificationButtonRef.current.getBoundingClientRect()
    const width = 352
    const top = rect.bottom + 8
    const left = Math.min(
      Math.max(16, rect.left + rect.width - width),
      window.innerWidth - width - 16
    )
    setDropdownPos({ top, left })
  }

  useEffect(() => {
    if (!showNotifications) return
    updateDropdownPosition()
    const handleResize = () => updateDropdownPosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [showNotifications])

  const markOrderAsRated = (orderId: string) => {
    const next = { ...ratedOrders, [orderId]: true }
    setRatedOrders(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rated-orders', JSON.stringify(next))
    }
  }

  const openReviewModal = (orderId: string) => {
    setReviewPendingOrderId(orderId)
    setReviewScores({ dish: 0, waiter: 0, restaurant: 0 })
    setReviewComments({ dish: '', waiter: '', restaurant: '' })
    setShowReviewModal(true)
  }

  const handleDeliveredStatus = (orderId: string) => {
    if (ratedOrders[orderId]) return
    openReviewModal(orderId)
  }

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  const toggleDishExpand = (dishId: string) => {
    setExpandedDishes((prev) => ({ ...prev, [dishId]: !prev[dishId] }))
  }

  const handleCopyPix = () => {
    if (restaurant?.pix_key) {
      navigator.clipboard.writeText(restaurant.pix_key)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2000)
    }
  }

  const handleCopyPhone = () => {
    if (restaurant?.restaurant_phone) {
      navigator.clipboard.writeText(restaurant.restaurant_phone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  const calculateDishPrice = (dish: any): number => {
    let totalPrice = dish.base_price || 0
    
    if (dish.dish_ingredients && dish.dish_ingredients.length > 0) {
      dish.dish_ingredients.forEach((ing: any) => {
        const currentQuantity = selectedIngredients[ing.ingredient_id] || 0
        
        // Cobra pela quantidade selecionada
        if (currentQuantity > 0) {
          const ingredientPrice = (ing.ingredients?.price || 0) + (ing.additional_price || 0)
          totalPrice += ingredientPrice * currentQuantity
        }
      })
    }
    
    return totalPrice
  }

  const openDishModal = (dish: any) => {
    setSelectedDish(dish)
    const defaultIngredients: Record<string, number> = {}
    if (dish.dish_ingredients) {
      dish.dish_ingredients.forEach((ing: any) => {
        // Todos os ingredientes começam em 0 (são adicionais)
        defaultIngredients[ing.ingredient_id] = 0
      })
    }
    console.log('🥘 Modal aberto com ingredientes padrão:', defaultIngredients)
    setSelectedIngredients(defaultIngredients)
  }

  const closeDishModal = () => {
    setSelectedDish(null)
    setSelectedIngredients({})
  }

  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setSelectedIngredients((prev) => ({
      ...prev,
      [ingredientId]: Math.max(0, quantity),
    }))
  }

  const addToCart = () => {
    if (!selectedDish) return
    
    const finalPrice = calculateDishPrice(selectedDish)
    
    console.log('🛒 Adicionando ao carrinho:')
    console.log('  - Dish:', selectedDish.id, selectedDish.name)
    console.log('  - Ingredientes selecionados:', selectedIngredients)
    console.log('  - Ingredientes do prato:', selectedDish.dish_ingredients?.map((ing: any) => ({
      id: ing.ingredient_id,
      name: ing.ingredients?.name,
      isDefault: ing.is_included_by_default
    })))
    
    const cartItem = {
      id: `${selectedDish.id}-${Date.now()}`,
      dishId: selectedDish.id,
      dishName: selectedDish.name,
      dishImage: selectedDish.primary_image,
      basePrice: selectedDish.base_price,
      finalPrice,
      ingredients: selectedIngredients,
      dishIngredients: selectedDish.dish_ingredients,
    }
    
    setCart((prev) => [...prev, cartItem])
    closeDishModal()
  }

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId))
  }

  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
      )
    )
  }

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => total + (item.finalPrice * (item.quantity || 1)), 0)
  }

  const handleFinalizePedido = async () => {
    if (cart.length === 0) return

    setIsSubmitting(true)

    try {
      console.log('🛒 Iniciando envio do pedido...', {
        restaurantId: restaurant.id,
        itemsCount: cart.length,
        totalPrice: getTotalPrice(),
      })

      const result = await submitMenuOrder({
        restaurantId: restaurant.id,
        tableId: table?.id,
        items: cart.map((item) => {
          console.log('📦 Item do carrinho:', {
            dishName: item.dishName,
            selectedIngredients: item.ingredients,
            allIngredients: item.dishIngredients?.length,
          })
          return {
            dishId: item.dishId,
            dishName: item.dishName,
            basePrice: item.basePrice,
            finalPrice: item.finalPrice,
            quantity: item.quantity || 1,
            ingredients: item.ingredients,
            dishIngredients: item.dishIngredients || [],
          }
        }),
        totalPrice: getTotalPrice(),
        customerName: 'Cliente Online',
      })

      console.log('📋 Resposta do servidor:', result)

      if (result.success) {
        setLastOrderDishIds(cart.map((item) => item.dishId))
        setLastOrderDishNames(cart.map((item) => item.dishName))
        setOrderSuccess(true)
        setCart([])
        setShowCart(false)
        
        // Salvar ID do pedido para monitorar atualizações
        if (result.data?.id) {
          setLastOrderId(result.data.id)
          localStorage.setItem('lastOrderId', result.data.id)
          console.log('📦 Pedido criado! ID:', result.data.id)
        }
        
        // Mostrar mensagem de sucesso por 3 segundos
        setTimeout(() => {
          setOrderSuccess(false)
        }, 3000)
      } else {
        console.error('❌ Erro ao criar pedido:', result.error)
        alert(t('publicMenu.errors.createOrder') + ': ' + result.error)
      }
    } catch (error) {
      console.error('💥 Error submitting order:', error)
      alert(t('publicMenu.errors.submitOrder') + ': ' + (error instanceof Error ? error.message : t('publicMenu.errors.unknown')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitReview = async () => {
    if (!reviewPendingOrderId) return
    setReviewSubmitting(true)
    try {
      const supabase = createClient()
      const payload = [
        {
          restaurant_id: restaurant.id,
          target_type: 'restaurant',
          target_id: restaurant.id,
          order_id: reviewPendingOrderId,
          rating: reviewScores.restaurant,
          comment: reviewComments.restaurant?.trim() || null,
        },
        {
          restaurant_id: restaurant.id,
          target_type: 'waiter',
          target_id: null,
          order_id: reviewPendingOrderId,
          rating: reviewScores.waiter,
          comment: reviewComments.waiter?.trim() || null,
        },
        {
          restaurant_id: restaurant.id,
          target_type: 'dish',
          target_id: lastOrderDishIds[0] || null,
          order_id: reviewPendingOrderId,
          rating: reviewScores.dish,
          comment: reviewComments.dish?.trim() || null,
        },
      ]

      const { error } = await supabase.from('reviews').insert(payload as any)
      if (error) throw error

      markOrderAsRated(reviewPendingOrderId)
      setShowReviewModal(false)
      setReviewPendingOrderId(null)
      setReviewScores({ dish: 0, waiter: 0, restaurant: 0 })
      setReviewComments({ dish: '', waiter: '', restaurant: '' })
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err)
      alert(t('publicMenu.errors.submitReview'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  const isRestaurantOpen = () => {
    if (!restaurant?.business_hours) return true
    const day = new Date().getDay()
    const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }
    const todayIndex = dayMap[day as keyof typeof dayMap]
    const todayHours = restaurant.business_hours?.[todayIndex]
    return !todayHours?.closed
  }

  const renderStars = (field: 'dish' | 'waiter' | 'restaurant') => (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setReviewScores((prev) => ({ ...prev, [field]: value }))}
          className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
          aria-label={`Avaliar ${field} com ${value} estrela(s)`}
        >
          <FiStar 
            size={28} 
            fill={value <= reviewScores[field] ? 'currentColor' : 'none'}
            className={value <= reviewScores[field] ? 'text-yellow-400' : 'text-stone-300 dark:text-stone-600'} 
          />
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-[9998] flex h-14 sm:h-16 shrink-0 items-center gap-x-1 min-[400px]:gap-x-2 sm:gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 min-[400px]:px-2 sm:px-4 shadow-sm sm:gap-x-6 lg:px-8">
        <div className="flex flex-1 gap-x-1 min-[400px]:gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1 items-center min-w-0">
            <h2 className="text-sm min-[400px]:text-base sm:text-lg font-semibold truncate bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">iMenuFlow</h2>
          </div>
          <div className="flex items-center gap-x-1 min-[400px]:gap-x-1.5 sm:gap-x-4 lg:gap-x-6">
            {/* Sininho de Notificações */}
            <div className="relative notification-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                ref={notificationButtonRef}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              >
                <FiBell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
              title="Selecionar idioma"
              aria-label="Selecionar idioma"
              className="hidden min-[400px]:block px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[45px] sm:min-w-[80px]"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.flag} {loc.name}
                </option>
              ))}
            </select>

            <button
              onClick={toggleTheme}
              className="hidden min-[350px]:block p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? (
                <FiMoon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <FiSun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {user && user.email && (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-300/60 dark:border-gray-600/60">
                  {user.user_metadata?.picture || user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.picture || user.user_metadata.avatar_url}
                      alt={user.user_metadata.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {(user.user_metadata?.name || user.email || '?').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] lg:max-w-none">
                  {user.user_metadata.name || user.email}
                </span>
                <form action={signOut}>
                  <Button variant="ghost" size="sm" type="submit">
                    <FiLogOut className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotifications && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="notification-dropdown fixed z-[99999] w-[22rem]"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl border-2 border-amber-500/20 dark:border-amber-400/15 overflow-hidden backdrop-blur-2xl">
              <div className="px-4 py-3 border-b border-amber-100/60 dark:border-amber-400/15 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-300 font-semibold">{t('dashboardKitchen.notifications')}</p>
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('dashboardKitchen.notifications')}</h3>
                </div>
                {notifications.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200 border border-amber-200/70 dark:border-amber-400/30">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {t('dashboardWaiter.noNotifications')}
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 border-b border-amber-100/50 dark:border-amber-400/10 hover:bg-amber-50/60 dark:hover:bg-amber-400/5 transition-colors"
                    >
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString(locale as any, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-amber-100/60 dark:border-amber-400/10 bg-amber-50/50 dark:bg-amber-400/5">
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-200 hover:text-amber-800 dark:hover:text-amber-100"
                  >
                    {t('publicMenu.notifications.clearAll')}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      }

      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-amber-500/20 dark:border-amber-400/10 shadow-2xl bg-amber-500/40 dark:bg-amber-500/25 h-40 sm:h-56 backdrop-blur-xl">
          {restaurant.cover_url && (
            <Image
              src={restaurant.cover_url}
              alt={getLocalizedValue(restaurant.name, 'Restaurante')}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-transparent" />
        </section>

        {/* Info colada ao banner (sobreposta) */}
        <section className="-mt-10 relative z-10">
          <div className="rounded-xl sm:rounded-2xl border-2 border-amber-500/20 dark:border-amber-400/15 bg-white/90 dark:bg-gray-900/75 backdrop-blur-2xl shadow-2xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 flex flex-col md:flex-row gap-3 sm:gap-4 items-start md:items-center">
            {restaurant.logo_url && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 sm:border-4 menu-theme-border bg-white flex-shrink-0">
                <Image src={restaurant.logo_url} alt={getLocalizedValue(restaurant.name, 'Restaurante')} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 dark:text-white break-words">{getLocalizedValue(restaurant.name, t('dashboardReviews.restaurant'))}</h1>
                <span className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${isRestaurantOpen() ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${isRestaurantOpen() ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {isRestaurantOpen() ? t('common.open') : t('common.closed')}
                </span>
              </div>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-sm md:text-base">
                {getLocalizedValue(restaurant.description, '')}
              </p>
              {restaurant.restaurant_phone && (
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://wa.me/${restaurant.restaurant_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-green-500 text-white text-sm sm:text-base font-semibold hover:bg-green-600 transition"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate max-w-[150px] sm:max-w-none">{restaurant.restaurant_phone}</span>
                  </a>
                  <button
                    onClick={handleCopyPhone}
                    className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition flex-shrink-0"
                    title="Copiar telefone"
                  >
                    {copiedPhone ? <span className="text-xs">✓</span> : <FiCopy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cardápio */}
        <section className="bg-white/85 dark:bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border-2 border-amber-500/20 dark:border-amber-400/15 shadow-2xl overflow-hidden">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-amber-100/60 dark:border-white/10">
            <div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('publicMenu.menu')}</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('publicMenu.selectDish')}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white menu-theme-bg">
              <span className="w-2 h-2 rounded-full bg-white" />
              {categories.filter((c) => dishes.some((d) => d.category_id === c.id)).length} {t('menu.categories')}
            </div>
          </div>

          {categories.length > 0 ? (
            <div className="divide-y divide-amber-100/60 dark:divide-white/5">
              {categories
                .filter((category) => {
                  const categoryDishes = dishes.filter((d) => d.category_id === category.id)
                  return categoryDishes.length > 0
                })
                .map((category) => {
                const categoryDishes = dishes.filter((d) => d.category_id === category.id)
                const isOpen = openCategories[category.id]

                return (
                  <div key={category.id} className="pt-1">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-amber-50/40 dark:hover:bg-white/5 transition-colors border-t border-amber-100/40 dark:border-white/5"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-1 h-6 rounded-full menu-theme-bg" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{getLocalizedValue(category.name)}</span>
                          <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{categoryDishes.length} {t('menu.dishes')}</span>
                        </div>
                      </div>
                      <FiChevronDown
                        className={`w-5 h-5 text-stone-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && categoryDishes.length > 0 && (
                      <div className="divide-y divide-amber-100/60 dark:divide-white/5">
                        {categoryDishes.map((dish) => (
                          <div key={dish.id} className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">
                            <button
                              onClick={() => openDishModal(dish)}
                              className={`w-full text-left rounded-xl p-3 border transition-all backdrop-blur-md cursor-pointer group ${
                                theme === 'dark'
                                  ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/40 hover:border-gray-600/60 hover:shadow-lg'
                                  : 'bg-gradient-to-br from-white/60 to-gray-100/40 border-gray-200/40 hover:border-gray-300/60 hover:shadow-lg'
                              }`}
                            >
                              <div className="flex gap-3">
                                {dish.primary_image && (
                                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700/40">
                                    <Image src={dish.primary_image} alt={getLocalizedValue(dish.name, 'Prato')} fill className="object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-bold text-sm leading-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {getLocalizedValue(dish.name)}
                                  </h3>
                                  <p className={`text-xs leading-relaxed mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {expandedDishes[dish.id]
                                      ? getLocalizedValue(dish.description)
                                      : getLocalizedValue(dish.description)?.substring(0, 120) + (getLocalizedValue(dish.description)?.length > 120 ? '...' : '')}
                                  </p>
                                  {dish.ingredients_list && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                                      {dish.ingredients_list}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="text-lg font-bold menu-theme-text">
                                      R$ {(dish.base_price || 0).toFixed(2)}
                                    </div>
                                    <div className={`text-xs font-semibold px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-200/60 text-gray-700'} group-hover:opacity-100 opacity-75 transition`}>
                                      {t('publicMenu.customize')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-stone-500 dark:text-stone-400">{t('publicMenu.noDisheAvailable')}</div>
          )}
        </section>

        {/* Info extras */}
        <section className="grid gap-6 lg:grid-cols-2">
          {(restaurant?.social_media && Object.keys(restaurant.social_media).length > 0) || restaurant?.restaurant_phone ? (
            <div
              className={`rounded-2xl p-5 border-2 shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/50 border-amber-400/15' : 'bg-gradient-to-br from-white/80 to-gray-100/70 border-amber-500/20'}`}
            >
              <p className={`font-bold text-sm mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                <FiPhone className="w-4 h-4" /> Redes Sociais & Contato
              </p>
              <div className="flex flex-wrap gap-3">
                {restaurant?.social_media?.instagram && (
                  <a
                    href={`https://instagram.com/${restaurant.social_media.instagram.replace(/[^a-zA-Z0-9._]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg menu-theme-bg text-white font-semibold hover:opacity-90 transition"
                  >
                    <FiInstagram className="w-4 h-4" /> Instagram
                  </a>
                )}
                {restaurant?.social_media?.facebook && (
                  <a
                    href={`https://facebook.com/${restaurant.social_media.facebook.replace(/[^a-zA-Z0-9._-]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg menu-theme-bg text-white font-semibold hover:opacity-90 transition"
                  >
                    <FiFacebook className="w-4 h-4" /> Facebook
                  </a>
                )}
                {restaurant?.social_media?.twitter && (
                  <a
                    href={`https://twitter.com/${restaurant.social_media.twitter.replace(/[^a-zA-Z0-9_]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg menu-theme-bg text-white font-semibold hover:opacity-90 transition"
                  >
                    <FiTwitter className="w-4 h-4" /> Twitter
                  </a>
                )}
                {restaurant?.social_media?.linkedin && (
                  <a
                    href={`https://linkedin.com/company/${restaurant.social_media.linkedin.replace(/[^a-zA-Z0-9-]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg menu-theme-bg text-white font-semibold hover:opacity-90 transition"
                  >
                    <FiLinkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {restaurant?.social_media?.youtube && (
                  <a
                    href={`https://youtube.com/${restaurant.social_media.youtube.replace(/[^a-zA-Z0-9_-]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg menu-theme-bg text-white font-semibold hover:opacity-90 transition"
                  >
                    <FiYoutube className="w-4 h-4" /> YouTube
                  </a>
                )}
              </div>
            </div>
          ) : null}

          {restaurant?.business_hours && restaurant.business_hours.length > 0 && (
            <div
              className={`rounded-2xl p-3 min-[400px]:p-4 sm:p-5 border-2 shadow-2xl backdrop-blur-xl lg:col-span-2 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/50 border-amber-400/15' : 'bg-gradient-to-br from-white/80 to-gray-100/70 border-amber-500/20'}`}
            >
              <p className={`font-bold text-xs min-[400px]:text-sm mb-2 min-[400px]:mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                📅 {t('dashboardSettings.businessHours')}
              </p>
              <div className="grid grid-cols-7 gap-1 min-[400px]:gap-2">
                {restaurant.business_hours.map((hour: any) => {
                  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
                  const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(hour.day.toLowerCase())
                  return (
                    <div key={hour.day} className="flex flex-col items-center">
                      <span className={`text-[10px] min-[400px]:text-xs font-bold mb-0.5 min-[400px]:mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {days[dayIndex] || hour.day.substring(0, 3)}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className={`px-1 min-[400px]:px-1.5 py-0.5 min-[400px]:py-1 rounded-lg text-[8px] min-[400px]:text-[10px] sm:text-xs font-semibold text-center text-white whitespace-nowrap ${hour.closed ? 'bg-red-500' : 'menu-theme-bg'}`}>
                          {hour.closed ? t('common.closed') : (
                            <div className="flex flex-col gap-0.5">
                              <span>{hour.openTime?.substring(0, 5)}</span>
                              {hour.closeTime && <span className="text-[7px] min-[400px]:text-[8px] opacity-90">{hour.closeTime?.substring(0, 5)}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {restaurant?.pix_key && (
            <div
              className={`rounded-2xl p-4 border-2 shadow-2xl backdrop-blur-xl lg:col-span-2 ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/50 border-amber-400/15 hover:border-amber-300/25'
                  : 'bg-gradient-to-br from-white/80 to-gray-100/70 border-amber-500/20 hover:border-amber-500/30'
              }`}
            >
              <p className={`font-bold text-sm mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                <FiCopy className="w-4 h-4" /> PIX
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div
                  className={`flex-1 px-3 py-2 rounded-lg font-mono text-xs break-all backdrop-blur ${
                    theme === 'dark'
                      ? 'bg-gray-950/50 text-gray-100 border border-gray-700/30'
                      : 'bg-white/60 text-gray-900 border border-gray-200/60'
                  }`}
                >
                  {restaurant.pix_key}
                </div>
                <button
                  onClick={handleCopyPix}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-white transition-all shadow-lg ${
                    copiedPix ? 'bg-emerald-500 shadow-emerald-300/60' : 'menu-theme-bg shadow-lg'
                  }`}
                >
                  {copiedPix ? 'Copiado!' : 'Copiar PIX'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal de Personalização de Prato */}
      {selectedDish && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-y-auto max-h-[90vh] ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header Modal */}
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {getLocalizedValue(selectedDish.name, t('menu.dishes'))}
                  </h2>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('publicMenu.customize')}
                  </p>
                </div>
                <button
                  onClick={closeDishModal}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo Modal */}
            <div className="px-6 py-6 space-y-6">
              {/* Imagem do Prato */}
              {selectedDish.primary_image && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={selectedDish.primary_image}
                    alt={getLocalizedValue(selectedDish.name, t('menu.dishes'))}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Descrição */}
              {selectedDish.description && (
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getLocalizedValue(selectedDish.description, '')}
                </p>
              )}

              {/* Ingredientes */}
              {selectedDish.dish_ingredients && selectedDish.dish_ingredients.length > 0 && (
                <div>
                  <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('publicMenu.ingredients')}
                  </h3>
                  <div className="space-y-3">
                    {selectedDish.dish_ingredients.map((ingredient: any) => (
                      <div
                        key={ingredient.ingredient_id}
                        className={`rounded-lg p-4 border transition-all ${
                          theme === 'dark'
                            ? 'bg-gray-800/60 border-gray-700/40'
                            : 'bg-gray-50/60 border-gray-200/40'
                        }`}
                      >
                        <div className="flex gap-4 items-start">
                          {/* Imagem Ingrediente */}
                          {ingredient.ingredients?.image_url && (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-sm border border-gray-300 dark:border-gray-600">
                              <Image
                                src={ingredient.ingredients.image_url}
                                alt={getLocalizedValue(ingredient.ingredients.name, t('publicMenu.ingredients'))}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {getLocalizedValue(ingredient.ingredients?.name, t('publicMenu.ingredients'))}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {ingredient.ingredients?.price > 0 && (
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                      R$ {(ingredient.ingredients?.price || 0).toFixed(2)}
                                    </p>
                                  )}
                                  {ingredient.additional_price > 0 && (
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                                      +R$ {(ingredient.additional_price || 0).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${ingredient.is_optional ? theme === 'dark' ? 'bg-blue-900/60 text-blue-200' : 'bg-blue-100 text-blue-700' : theme === 'dark' ? 'bg-green-900/60 text-green-200' : 'bg-green-100 text-green-700'}`}>
                                {ingredient.is_optional ? t('menu.optional') : t('menu.includedByDefault')}
                              </span>
                            </div>

                            {/* Controle de Quantidade */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  updateIngredientQuantity(
                                    ingredient.ingredient_id,
                                    (selectedIngredients[ingredient.ingredient_id] || 0) - 1
                                  )
                                }
                                className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                                  theme === 'dark'
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                −
                              </button>
                              <span className={`w-8 text-center font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {selectedIngredients[ingredient.ingredient_id] || 0}
                              </span>
                              <button
                                onClick={() =>
                                  updateIngredientQuantity(
                                    ingredient.ingredient_id,
                                    (selectedIngredients[ingredient.ingredient_id] || 0) + 1
                                  )
                                }
                                className={`w-8 h-8 rounded-lg font-bold transition-colors menu-theme-bg text-white hover:opacity-90`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preço Final */}
              <div className={`rounded-xl p-4 border-2 ${
                theme === 'dark'
                  ? 'bg-gray-800/60 border-gray-700/60'
                  : 'bg-gray-50/60 border-gray-200/60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('publicMenu.total')}:
                  </span>
                  <span className="text-2xl font-bold menu-theme-text">
                    R$ {calculateDishPrice(selectedDish).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeDishModal}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                  >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={addToCart}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-white menu-theme-bg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {t('publicMenu.addToOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ícone Flutuante do Carrinho */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          title={t('publicMenu.viewOrder')}
          className="fixed bottom-8 right-8 z-[9998] flex items-center justify-center w-16 h-16 rounded-full text-white menu-theme-bg shadow-2xl hover:shadow-xl hover:scale-110 transition-all"
        >
          <div className="relative">
            <FiShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cart.length}
            </span>
          </div>
        </button>
      )}

      {/* Modal de Avaliação pós-entrega */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 px-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}>
              <div>
                <p className="text-xs text-stone-500">Obrigado pela sua visita!</p>
                <h3 className="text-xl font-bold">Como foi sua experiência?</h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                aria-label="Fechar avaliação"
              >
                <FiX />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Avalie o prato {lastOrderDishNames[0] ? `(${lastOrderDishNames[0]})` : ''}
                </p>
                {renderStars('dish')}
                <textarea
                  value={reviewComments.dish}
                  onChange={(e) => setReviewComments((prev) => ({ ...prev, dish: e.target.value }))}
                  placeholder="Conte como foi o prato"
                  className={`w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'}`}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Avalie o atendimento do garçom
                </p>
                {renderStars('waiter')}
                <textarea
                  value={reviewComments.waiter}
                  onChange={(e) => setReviewComments((prev) => ({ ...prev, waiter: e.target.value }))}
                  placeholder="Como foi o atendimento?"
                  className={`w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'}`}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Avalie o restaurante
                </p>
                {renderStars('restaurant')}
                <textarea
                  value={reviewComments.restaurant}
                  onChange={(e) => setReviewComments((prev) => ({ ...prev, restaurant: e.target.value }))}
                  placeholder="Compartilhe sua experiência geral"
                  className={`w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'}`}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    if (reviewPendingOrderId) {
                      markOrderAsRated(reviewPendingOrderId)
                      setReviewPendingOrderId(null)
                    }
                    setReviewScores({ dish: 0, waiter: 0, restaurant: 0 })
                    setReviewComments({ dish: '', waiter: '', restaurant: '' })
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Talvez depois
                </button>
                <button
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white menu-theme-bg hover:opacity-90 disabled:opacity-60 flex items-center gap-2`}
                >
                  {reviewSubmitting ? 'Enviando...' : 'Enviar avaliação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Carrinho */}
      {showCart && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-y-auto max-h-[90vh] ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <FiShoppingCart className="w-6 h-6" />
                  {t('publicMenu.viewOrder')}
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  title="Fechar carrinho"
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="px-6 py-6">
              {cart.length === 0 ? (
                <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('publicMenu.emptyCart')}
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg p-4 border flex gap-4 ${
                        theme === 'dark'
                          ? 'bg-gray-800/60 border-gray-700/40'
                          : 'bg-gray-50/60 border-gray-200/40'
                      }`}
                    >
                      {/* Imagem */}
                      {item.dishImage && (
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
                          <Image src={item.dishImage} alt={item.dishName} fill className="object-cover" />
                        </div>
                      )}

                      {/* Infos */}
                      <div className="flex-1">
                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.dishName}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          R$ {item.finalPrice.toFixed(2)}
                        </p>
                        {Object.values(item.ingredients).some((q: any) => q > 0) && (
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            {Object.keys(item.ingredients).filter((k) => item.ingredients[k] > 0).length} ingrediente(s) customizado(s)
                          </p>
                        )}
                      </div>

                      {/* Controles */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            title="Remover do carrinho"
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'dark'
                                ? 'bg-red-900/60 text-red-200 hover:bg-red-900'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Qtd: {item.quantity || 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo e Botão */}
            {cart.length > 0 && (
              <div className={`sticky bottom-0 px-6 py-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`rounded-lg p-4 mb-4 ${
                  theme === 'dark'
                    ? 'bg-gray-900/60 border border-gray-700/40'
                    : 'bg-white/60 border border-gray-200/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('publicMenu.total')}:
                    </span>
                    <span className="text-2xl font-bold menu-theme-text">
                      R$ {getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleFinalizePedido}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-white menu-theme-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSubmitting ? t('common.loading') : t('publicMenu.placeOrder')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificação de Sucesso */}
      {orderSuccess && (
        <div className="fixed top-4 right-4 z-[10000] animate-pulse">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-bold">{t('publicMenu.orderPlaced')}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        :root {
          --menu-theme: ${themeColor};
        }
        .menu-theme-bg {
          background-color: var(--menu-theme);
          color: #fff;
        }
        .menu-theme-text {
          color: var(--menu-theme);
        }
        .menu-theme-soft {
          background-color: #fff;
          color: var(--menu-theme);
          border: 1px solid var(--menu-theme);
        }
        .menu-theme-chip {
          background-color: var(--menu-theme);
          color: #fff;
          border: 1px solid var(--menu-theme);
        }
        .menu-theme-border {
          border-color: var(--menu-theme);
          background-color: #fff;
        }
        .menu-theme-price {
          background-color: #fff;
          color: var(--menu-theme);
          border: 1px solid var(--menu-theme);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  )
}
