import ordersReducer, {
  setOrders,
  addOrder,
  updateOrder,
  updateOrderStatus,
  setCurrentOrder,
  selectAllOrders,
  selectCurrentOrder,
  selectOrdersByStatus,
  selectOrdersByTable,
} from '@/store/slices/ordersSlice'
import { configureStore } from '@reduxjs/toolkit'
import type { Order } from '@/store/slices/ordersSlice'

describe('ordersSlice', () => {
  const mockOrder: Order = {
    id: 'order-1',
    tableId: 'table-1',
    tableName: 'Mesa 1',
    items: [],
    status: 'pending',
    createdAt: '2024-01-01',
    totalPrice: 100,
  }

  const initialState = {
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,
  }

  it('should handle setOrders', () => {
    const orders = [mockOrder]
    const state = ordersReducer(initialState, setOrders(orders))
    expect(state.orders).toHaveLength(1)
    expect(state.orders[0]).toEqual(mockOrder)
  })

  it('should handle addOrder', () => {
    const state = ordersReducer(initialState, addOrder(mockOrder))
    expect(state.orders).toHaveLength(1)
    expect(state.currentOrder).toEqual(mockOrder)
  })

  it('should handle updateOrder', () => {
    let state = ordersReducer(initialState, addOrder(mockOrder))
    const updatedOrder = { ...mockOrder, status: 'preparing' as const }
    state = ordersReducer(state, updateOrder(updatedOrder))
    
    expect(state.orders[0].status).toBe('preparing')
    expect(state.currentOrder?.status).toBe('preparing')
  })

  it('should handle updateOrderStatus', () => {
    let state = ordersReducer(initialState, addOrder(mockOrder))
    state = ordersReducer(state, updateOrderStatus({ orderId: 'order-1', status: 'ready' }))
    
    expect(state.orders[0].status).toBe('ready')
  })

  it('should handle setCurrentOrder', () => {
    let state = ordersReducer(initialState, addOrder(mockOrder))
    const newOrder = { ...mockOrder, id: 'order-2' }
    state = ordersReducer(initialState, addOrder(newOrder))
    state = ordersReducer(state, setCurrentOrder(mockOrder))
    
    expect(state.currentOrder?.id).toBe('order-1')
  })

  it('should use selectors correctly', () => {
    const store = configureStore({
      reducer: {
        orders: ordersReducer,
      },
    })

    store.dispatch(addOrder(mockOrder))
    
    const state = store.getState()
    expect(selectAllOrders(state)).toHaveLength(1)
    expect(selectCurrentOrder(state)).toEqual(mockOrder)
  })

  it('should filter orders by status', () => {
    const store = configureStore({
      reducer: {
        orders: ordersReducer,
      },
    })

    const order1 = mockOrder
    const order2 = { ...mockOrder, id: 'order-2', status: 'ready' as const }
    
    store.dispatch(setOrders([order1, order2]))
    
    const state = store.getState()
    const pendingOrders = selectOrdersByStatus(state, 'pending')
    expect(pendingOrders).toHaveLength(1)
  })

  it('should filter orders by table', () => {
    const store = configureStore({
      reducer: {
        orders: ordersReducer,
      },
    })

    const order1 = mockOrder
    const order2 = { ...mockOrder, id: 'order-2', tableId: 'table-2' }
    
    store.dispatch(setOrders([order1, order2]))
    
    const state = store.getState()
    const tableOrders = selectOrdersByTable(state, 'table-1')
    expect(tableOrders).toHaveLength(1)
  })
})
