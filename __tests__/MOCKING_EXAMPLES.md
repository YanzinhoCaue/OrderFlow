/**
 * ARQUIVO DE REFERÊNCIA - Não contém testes executáveis
 * 
 * Este arquivo demonstra como fazer mocking e testes com Redux Thunks.
 * Copie e adapte estes exemplos para seus próprios testes.
 */

// Exemplo 1: Testar async thunk com sucesso
/*
import { submitOrder } from '@/store/thunks'
import { configureStore } from '@reduxjs/toolkit'
import ordersReducer from '@/store/slices/ordersSlice'

global.fetch = jest.fn()

describe('Redux Thunks with Mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle submitOrder success', async () => {
    const mockResponse = {
      id: 'order-1',
      tableId: 'table-1',
      items: [],
      totalPrice: 100
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    // Teste seu thunk aqui
  })
})
*/

// Exemplo 2: Testar componente com Redux Provider
/*
import { render, screen } from '@testing-library/react'
import { renderWithRedux } from './components/redux-integration.test'
import MyComponent from '@/components/MyComponent'

describe('Component with Redux', () => {
  it('should render with Redux state', () => {
    const initialState = {
      cart: {
        items: [{ id: '1', dishName: 'Pizza', price: 50, quantity: 1 }],
        totalItems: 1,
        totalPrice: 50,
      }
    }

    renderWithRedux(<MyComponent />, { initialState })
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })
})
*/

export const mockingExamples = true
