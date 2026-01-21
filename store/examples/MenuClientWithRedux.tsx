'use client'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addToCart,
  removeFromCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemsCount,
  clearCart,
} from '@/store/slices/cartSlice'
import { addOrder } from '@/store/slices/ordersSlice'
import { addNotification } from '@/store/slices/notificationsSlice'
import { useId } from 'react'

/**
 * Exemplo de como integrar Redux com MenuPageClient
 * 
 * Este exemplo mostra como:
 * 1. Acessar o estado do carrinho usando selectores
 * 2. Despachar ações para modificar o estado
 * 3. Usar notificações com Redux
 */

interface ExampleMenuClientProps {
  restaurantId: string
  tableId: string
}

export function ExampleMenuClientWithRedux({ restaurantId, tableId }: ExampleMenuClientProps) {
  const dispatch = useAppDispatch()
  
  // Seletores do Redux
  const cartItems = useAppSelector(selectCartItems)
  const cartTotal = useAppSelector(selectCartTotal)
  const cartItemsCount = useAppSelector(selectCartItemsCount)

  const handleAddToCart = (dishId: string, dishName: string, price: number) => {
    const cartItem = {
      id: `${dishId}-${useId()}`,
      dishId,
      dishName,
      price,
      quantity: 1,
      ingredients: [],
    }

    dispatch(addToCart(cartItem))

    // Adicionar notificação
    dispatch(
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'success',
        message: `${dishName} adicionado ao carrinho`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    )
  }

  const handleRemoveFromCart = (itemId: string) => {
    dispatch(removeFromCart(itemId))
    dispatch(
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'info',
        message: 'Item removido do carrinho',
        timestamp: new Date().toISOString(),
        read: false,
      })
    )
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      dispatch(
        addNotification({
          id: `notif-${Date.now()}`,
          type: 'warning',
          message: 'Carrinho vazio',
          timestamp: new Date().toISOString(),
          read: false,
        })
      )
      return
    }

    try {
      // Criar pedido
      const newOrder = {
        id: `order-${Date.now()}`,
        tableId,
        tableName: `Mesa ${tableId}`,
        items: cartItems,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        totalPrice: cartTotal,
      }

      dispatch(addOrder(newOrder))
      dispatch(clearCart())

      dispatch(
        addNotification({
          id: `notif-${Date.now()}`,
          type: 'success',
          message: 'Pedido enviado com sucesso!',
          timestamp: new Date().toISOString(),
          read: false,
        })
      )
    } catch (error) {
      dispatch(
        addNotification({
          id: `notif-${Date.now()}`,
          type: 'error',
          message: 'Erro ao enviar pedido',
          timestamp: new Date().toISOString(),
          read: false,
        })
      )
    }
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Cardápio da Mesa {tableId}</h2>
        <p className="text-gray-600">Itens no carrinho: {cartItemsCount}</p>
      </div>

      {/* Carrinho */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-xl font-semibold mb-4">Carrinho</h3>
        {cartItems.length === 0 ? (
          <p className="text-gray-500">Carrinho vazio</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between items-center p-2 bg-gray-50">
                  <div>
                    <p className="font-medium">{item.dishName}</p>
                    <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-green-500 text-white py-2 rounded font-semibold hover:bg-green-600"
              >
                Fazer Pedido
              </button>
            </div>
          </>
        )}
      </div>

      {/* Exemplo de Dish */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-xl font-semibold mb-4">Exemplo de Prato</h3>
        <button
          onClick={() => handleAddToCart('pizza-1', 'Pizza Margherita', 50)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Adicionar Pizza Margherita (R$ 50)
        </button>
      </div>
    </div>
  )
}
