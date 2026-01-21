import authReducer, {
  setUser,
  setLoading,
  setError,
  clearError,
  logout,
  selectUser,
  selectIsAuthenticated,
  selectAuthError,
} from '@/store/slices/authSlice'
import { configureStore } from '@reduxjs/toolkit'

describe('authSlice', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    roleType: 'customer' as const,
  }

  const initialState = {
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  }

  it('should handle setUser', () => {
    const state = authReducer(initialState, setUser(mockUser))
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.error).toBeNull()
  })

  it('should handle setLoading', () => {
    const state = authReducer(initialState, setLoading(true))
    expect(state.isLoading).toBe(true)
  })

  it('should handle setError', () => {
    const errorMessage = 'Authentication failed'
    const state = authReducer(initialState, setError(errorMessage))
    expect(state.error).toBe(errorMessage)
    expect(state.isLoading).toBe(false)
  })

  it('should handle clearError', () => {
    let state = authReducer(initialState, setError('Some error'))
    state = authReducer(state, clearError())
    expect(state.error).toBeNull()
  })

  it('should handle logout', () => {
    let state = authReducer(initialState, setUser(mockUser))
    expect(state.user).not.toBeNull()
    
    state = authReducer(state, logout())
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should use selectors correctly', () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    })

    store.dispatch(setUser(mockUser))
    
    const state = store.getState()
    expect(selectUser(state)).toEqual(mockUser)
    expect(selectIsAuthenticated(state)).toBe(true)
    expect(selectAuthError(state)).toBeNull()
  })

  it('should update error when setUser is called after error', () => {
    let state = authReducer(initialState, setError('Initial error'))
    state = authReducer(state, setUser(mockUser))
    
    expect(state.error).toBeNull()
    expect(state.isAuthenticated).toBe(true)
  })
})
