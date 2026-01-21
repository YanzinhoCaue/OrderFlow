import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

export interface OrderItem {
  id: string
  dishId: string
  dishName: string
  quantity: number
  price: number
  ingredients: Array<{
    id: string
    name: string
  }>
}

export interface Order {
  id: string
  tableId: string
  tableName: string
  items: OrderItem[]
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  createdAt: string
  totalPrice: number
}

interface OrdersState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload
      state.error = null
    },

    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.push(action.payload)
      state.currentOrder = action.payload
    },

    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id)
      if (index !== -1) {
        state.orders[index] = action.payload
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload
      }
    },

    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId)
      if (order) {
        order.status = action.payload.status as Order['status']
      }
    },

    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },

    clearOrders: (state) => {
      state.orders = []
      state.currentOrder = null
    },
  },
})

export const {
  setOrders,
  addOrder,
  updateOrder,
  updateOrderStatus,
  setCurrentOrder,
  setLoading,
  setError,
  clearOrders,
} = ordersSlice.actions

// Selectors
export const selectAllOrders = (state: RootState) => state.orders.orders
export const selectCurrentOrder = (state: RootState) => state.orders.currentOrder
export const selectOrdersLoading = (state: RootState) => state.orders.isLoading
export const selectOrdersError = (state: RootState) => state.orders.error
export const selectOrdersByStatus = (state: RootState, status: string) =>
  state.orders.orders.filter(o => o.status === status)
export const selectOrdersByTable = (state: RootState, tableId: string) =>
  state.orders.orders.filter(o => o.tableId === tableId)

export default ordersSlice.reducer
