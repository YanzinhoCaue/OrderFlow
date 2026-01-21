import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemsCount,
} from '@/store/slices/cartSlice'
import { configureStore } from '@reduxjs/toolkit'
import type { CartItem } from '@/store/slices/cartSlice'

describe('cartSlice', () => {
  const mockItem: CartItem = {
    id: '1',
    dishId: 'dish-1',
    dishName: 'Pizza',
    price: 50,
    quantity: 1,
    ingredients: [],
  }

  const initialState = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  }

  it('should handle addToCart', () => {
    const state = cartReducer(initialState, addToCart(mockItem))
    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toEqual(mockItem)
    expect(state.totalItems).toBe(1)
    expect(state.totalPrice).toBe(50)
  })

  it('should increase quantity if item already exists', () => {
    let state = cartReducer(initialState, addToCart(mockItem))
    state = cartReducer(state, addToCart({ ...mockItem, quantity: 2 }))
    
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(3)
    expect(state.totalItems).toBe(3)
    expect(state.totalPrice).toBe(150)
  })

  it('should handle removeFromCart', () => {
    let state = cartReducer(initialState, addToCart(mockItem))
    state = cartReducer(state, removeFromCart('1'))
    
    expect(state.items).toHaveLength(0)
    expect(state.totalItems).toBe(0)
    expect(state.totalPrice).toBe(0)
  })

  it('should handle updateQuantity', () => {
    let state = cartReducer(initialState, addToCart(mockItem))
    state = cartReducer(state, updateQuantity({ id: '1', quantity: 3 }))
    
    expect(state.items[0].quantity).toBe(3)
    expect(state.totalItems).toBe(3)
    expect(state.totalPrice).toBe(150)
  })

  it('should remove item if quantity is 0 or less', () => {
    let state = cartReducer(initialState, addToCart(mockItem))
    state = cartReducer(state, updateQuantity({ id: '1', quantity: 0 }))
    
    expect(state.items).toHaveLength(0)
    expect(state.totalItems).toBe(0)
  })

  it('should handle clearCart', () => {
    let state = cartReducer(initialState, addToCart(mockItem))
    state = cartReducer(state, addToCart({ ...mockItem, id: '2', dishName: 'Burger' }))
    state = cartReducer(state, clearCart())
    
    expect(state.items).toHaveLength(0)
    expect(state.totalItems).toBe(0)
    expect(state.totalPrice).toBe(0)
  })

  it('should use selectors correctly', () => {
    const store = configureStore({
      reducer: {
        cart: cartReducer,
      },
    })

    store.dispatch(addToCart(mockItem))
    
    const state = store.getState()
    expect(selectCartItems(state)).toHaveLength(1)
    expect(selectCartTotal(state)).toBe(50)
    expect(selectCartItemsCount(state)).toBe(1)
  })
})
