import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '@/store/slices/cartSlice'

// Exemplo de teste de componente com Redux
// Este é um template que deve ser usado para componentes que usam Redux

export function renderWithRedux(
  component: React.ReactElement,
  {
    initialState,
    store = configureStore({
      reducer: {
        cart: cartReducer,
      },
      preloadedState: initialState,
    }),
  } = {}
) {
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  }
}

describe('Redux Component Integration Helper', () => {
  it('should export renderWithRedux function', () => {
    expect(typeof renderWithRedux).toBe('function')
  })

  it('should render component with Redux provider', () => {
    const TestComponent = () => <div>Test Component</div>
    renderWithRedux(<TestComponent />)
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('should provide access to Redux store', () => {
    const TestComponent = () => <div>Redux Ready</div>
    const { store } = renderWithRedux(<TestComponent />)
    expect(store.getState()).toBeDefined()
    expect(store.getState().cart).toBeDefined()
  })

  it('should support initialState parameter', () => {
    const TestComponent = () => <div>Test</div>
    const preloadedState = {
      cart: {
        items: [
          {
            id: '1',
            dishId: 'pizza-1',
            dishName: 'Pizza',
            price: 50,
            quantity: 1,
            ingredients: [],
          },
        ],
        totalItems: 1,
        totalPrice: 50,
      },
    }
    
    const { store } = renderWithRedux(<TestComponent />, { initialState: preloadedState })
    const state = store.getState()
    expect(state.cart.items).toHaveLength(1)
    expect(state.cart.totalPrice).toBe(50)
  })
})
