import { createAsyncThunk } from '@reduxjs/toolkit'

/**
 * Exemplos de Async Thunks para Redux Toolkit
 * Use estes para operações assíncronas (API calls, etc)
 */

// Exemplo 1: Buscar pedidos do servidor
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (tableId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/orders?tableId=${tableId}`)
      if (!response.ok) {
        return rejectWithValue('Falha ao buscar pedidos')
      }
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Erro na requisição')
    }
  }
)

// Exemplo 2: Enviar pedido
export const submitOrder = createAsyncThunk(
  'orders/submitOrder',
  async (
    { tableId, items, totalPrice }: { tableId: string; items: any[]; totalPrice: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, items, totalPrice }),
      })

      if (!response.ok) {
        return rejectWithValue('Falha ao enviar pedido')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Erro ao enviar pedido')
    }
  }
)

// Exemplo 3: Fazer login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        return rejectWithValue('Credenciais inválidas')
      }

      const data = await response.json()
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        roleType: data.user.roleType,
      }
    } catch (error) {
      return rejectWithValue('Erro ao fazer login')
    }
  }
)

// Exemplo 4: Buscar notificações
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (!response.ok) {
        return rejectWithValue('Falha ao buscar notificações')
      }
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Erro ao buscar notificações')
    }
  }
)

/**
 * Como usar Async Thunks em um Slice
 * 
 * Exemplo com ordersSlice:
 * 
 * import { fetchOrders, submitOrder } from './thunks'
 * 
 * const ordersSlice = createSlice({
 *   name: 'orders',
 *   initialState,
 *   reducers: { ... },
 *   extraReducers: (builder) => {
 *     builder
 *       .addCase(fetchOrders.pending, (state) => {
 *         state.isLoading = true
 *       })
 *       .addCase(fetchOrders.fulfilled, (state, action) => {
 *         state.isLoading = false
 *         state.orders = action.payload
 *       })
 *       .addCase(fetchOrders.rejected, (state, action) => {
 *         state.isLoading = false
 *         state.error = action.payload
 *       })
 *       .addCase(submitOrder.pending, (state) => {
 *         state.isLoading = true
 *       })
 *       .addCase(submitOrder.fulfilled, (state, action) => {
 *         state.isLoading = false
 *         state.orders.push(action.payload)
 *       })
 *       .addCase(submitOrder.rejected, (state, action) => {
 *         state.isLoading = false
 *         state.error = action.payload
 *       })
 *   }
 * })
 * 
 * Como usar em um componente:
 * 
 * const dispatch = useAppDispatch()
 * 
 * const handleSubmitOrder = async () => {
 *   const result = await dispatch(submitOrder({
 *     tableId: '1',
 *     items: cartItems,
 *     totalPrice: 100
 *   }))
 *   
 *   if (result.type === submitOrder.fulfilled.type) {
 *     // Sucesso
 *   } else {
 *     // Erro
 *   }
 * }
 */
