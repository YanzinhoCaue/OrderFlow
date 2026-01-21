'use client'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  setUser,
  setLoading,
  setError,
  clearError,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  logout,
} from '@/store/slices/authSlice'

/**
 * Exemplo de como integrar Redux com componentes de autenticação
 * 
 * Este exemplo mostra como:
 * 1. Despachar ações de autenticação
 * 2. Acessar estado de autenticação
 * 3. Lidar com carregamento e erros
 */

export function ExampleAuthComponent() {
  const dispatch = useAppDispatch()

  const user = useAppSelector(selectUser)
  const isLoading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  const handleLogin = async (email: string, password: string) => {
    dispatch(setLoading(true))
    dispatch(clearError())

    try {
      // Simular chamada de API
      const mockUser = {
        id: 'user-1',
        email,
        name: 'John Doe',
        roleType: 'customer' as const,
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000))

      dispatch(setUser(mockUser))
    } catch (err) {
      dispatch(setError('Falha na autenticação'))
    }
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>
  }

  if (user) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="mb-2">
          Bem-vindo, <strong>{user.name}</strong>
        </p>
        <p className="text-sm text-gray-600 mb-4">Email: {user.email}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sair
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

      <button
        onClick={() => handleLogin('test@example.com', 'password')}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={isLoading}
      >
        {isLoading ? 'Entrando...' : 'Entrar com Google'}
      </button>
    </div>
  )
}
