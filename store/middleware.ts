import { Middleware } from '@reduxjs/toolkit'

/**
 * Middleware customizado para logging e debugging
 * Registra todas as ações e mudanças de estado
 */
export const loggerMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  console.group((action as any).type)
  console.info('dispatching', action)

  const result = next(action)

  console.log('next state', storeAPI.getState())
  console.groupEnd()

  return result
}

/**
 * Middleware para persistir estado no localStorage
 * Salva estado específico automaticamente
 */
export const persistStateMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action)
  const state = storeAPI.getState()

  // Persistir carrinho
  if ((action as any).type.startsWith('cart/')) {
    localStorage.setItem('cart-state', JSON.stringify((state as any).cart))
  }

  // Persistir autenticação
  if ((action as any).type.startsWith('auth/')) {
    localStorage.setItem('auth-state', JSON.stringify((state as any).auth))
  }

  return result
}

/**
 * Middleware para analytics
 * Rastreia ações importantes para analytics
 */
export const analyticsMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action)

  // Rastrear ações específicas
  if (
    (action as any).type === 'cart/addToCart' ||
    (action as any).type === 'orders/addOrder' ||
    (action as any).type === 'auth/setUser'
  ) {
    // Aqui você enviaria para um serviço de analytics
    console.log('[Analytics]', (action as any).type, (action as any).payload)
  }

  return result
}

/**
 * Middleware para notificações de erro
 * Mostra notificações quando há erros
 */
export const errorNotificationMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  const result = next(action)

  if (
    (action as any).type.endsWith('/rejected') ||
    (action as any).type.includes('error')
  ) {
    console.error('[Error]', (action as any).payload)
    // Aqui você mostraria uma notificação visual ao usuário
  }

  return result
}

/**
 * Como adicionar middlewares ao store:
 * 
 * import { configureStore } from '@reduxjs/toolkit'
 * import { loggerMiddleware, persistStateMiddleware } from './middleware'
 * 
 * export const store = configureStore({
 *   reducer: { ... },
 *   middleware: (getDefaultMiddleware) =>
 *     getDefaultMiddleware()
 *       .concat(loggerMiddleware)
 *       .concat(persistStateMiddleware)
 *       .concat(analyticsMiddleware)
 * })
 */
