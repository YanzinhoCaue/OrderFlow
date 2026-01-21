/**
 * Testes de Snapshot para Redux Slices
 * 
 * Snapshot testing é útil para garantir que o estado
 * não muda inesperadamente entre versões
 */

import cartReducer, { addToCart } from '@/store/slices/cartSlice'
import authReducer, { setUser } from '@/store/slices/authSlice'

describe('Redux State Snapshots', () => {
  it('should match cart snapshot', () => {
    const mockItem = {
      id: '1',
      dishId: 'pizza-1',
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

    const state = cartReducer(initialState, addToCart(mockItem))
    expect(state).toMatchSnapshot()
  })

  it('should match auth snapshot', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'John Doe',
      roleType: 'customer' as const,
    }

    const initialState = {
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    }

    const state = authReducer(initialState, setUser(mockUser))
    expect(state).toMatchSnapshot()
  })
})
