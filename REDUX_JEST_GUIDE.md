# Redux Toolkit e Jest - Guia de Implementação

## 🚀 Instalação

As dependências já foram adicionadas ao `package.json`. Para instalar:

```bash
npm install
```

### Dependências Adicionadas:
- `@reduxjs/toolkit` - State management
- `react-redux` - React bindings for Redux
- `jest` - Testing framework
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Jest matchers

## 📁 Estrutura de Pastas

```
store/
├── index.ts                 # Redux store configuration
├── hooks.ts                # Custom hooks (useAppDispatch, useAppSelector)
├── provider.tsx            # Redux Provider component
└── slices/
    ├── cartSlice.ts        # Cart state management
    ├── authSlice.ts        # Authentication state
    ├── ordersSlice.ts      # Orders state
    └── notificationsSlice.ts # Notifications state

__tests__/
├── store/
│   ├── cartSlice.test.ts
│   ├── authSlice.test.ts
│   ├── ordersSlice.test.ts
│   └── notificationsSlice.test.ts
└── components/
    └── redux-integration.test.ts
```

## 🔧 Como Usar Redux no Seu Projeto

### 1. Configurar o Provider

Adicione o `ReduxProvider` ao arquivo raiz (`app/layout.tsx`):

```typescript
import { ReduxProvider } from '@/store/provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  )
}
```

### 2. Usar Redux em Componentes Client

```typescript
'use client'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToCart, selectCartItems } from '@/store/slices/cartSlice'

export function MyComponent() {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(selectCartItems)

  const handleAddToCart = (item) => {
    dispatch(addToCart(item))
  }

  return (
    <div>
      {cartItems.map(item => (
        <div key={item.id}>{item.dishName}</div>
      ))}
    </div>
  )
}
```

### 3. Estrutura de um Slice

Cada slice Redux contém:
- **State**: Definição do tipo de estado
- **Reducers**: Funções que modificam o estado
- **Actions**: Exportadas automaticamente pelo Redux Toolkit
- **Selectors**: Funções para acessar partes do estado

Exemplo (cartSlice.ts):
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CartState {
  items: CartItem[]
  totalPrice: number
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], totalPrice: 0 },
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.items.push(action.payload)
      // state é mutável aqui graças ao Immer
    }
  }
})

export const { addToCart } = cartSlice.actions
export const selectCartItems = (state: RootState) => state.cart.items
```

## 📊 Slices Disponíveis

### Cart Slice
Gerencia itens do carrinho
```typescript
dispatch(addToCart(item))
dispatch(removeFromCart(itemId))
dispatch(updateQuantity({ id: itemId, quantity: 3 }))
dispatch(clearCart())

const items = useAppSelector(selectCartItems)
const total = useAppSelector(selectCartTotal)
const count = useAppSelector(selectCartItemsCount)
```

### Auth Slice
Gerencia autenticação
```typescript
dispatch(setUser(user))
dispatch(setLoading(true))
dispatch(setError('error message'))
dispatch(logout())

const user = useAppSelector(selectUser)
const isAuth = useAppSelector(selectIsAuthenticated)
const role = useAppSelector(selectUserRole)
```

### Orders Slice
Gerencia pedidos
```typescript
dispatch(addOrder(order))
dispatch(updateOrder(order))
dispatch(updateOrderStatus({ orderId, status }))

const orders = useAppSelector(selectAllOrders)
const pending = useAppSelector(state => selectOrdersByStatus(state, 'pending'))
const tableOrders = useAppSelector(state => selectOrdersByTable(state, tableId))
```

### Notifications Slice
Gerencia notificações
```typescript
dispatch(addNotification(notification))
dispatch(removeNotification(notifId))
dispatch(markAsRead(notifId))
dispatch(markAllAsRead())

const notifications = useAppSelector(selectAllNotifications)
const unread = useAppSelector(selectUnreadNotifications)
const count = useAppSelector(selectUnreadCount)
```

## 🧪 Testes com Jest

### Executar Testes

```bash
# Watch mode (reexecuta ao salvar)
npm test

# CI mode (executa uma vez)
npm run test:ci

# Com coverage
npm test -- --coverage
```

### Estrutura de Testes

Cada slice tem testes para:
- Reducers (verificam se o estado é modificado corretamente)
- Selectors (verificam se retornam os dados corretos)
- Múltiplas ações em sequência

Exemplo de teste:
```typescript
import cartReducer, { addToCart } from '@/store/slices/cartSlice'

describe('cartSlice', () => {
  it('should add item to cart', () => {
    const initialState = { items: [], totalItems: 0, totalPrice: 0 }
    const item = { id: '1', dishName: 'Pizza', price: 50, quantity: 1 }
    
    const state = cartReducer(initialState, addToCart(item))
    
    expect(state.items).toHaveLength(1)
    expect(state.totalPrice).toBe(50)
  })
})
```

### Testar Componentes com Redux

Use a função `renderWithRedux` do arquivo `__tests__/components/redux-integration.test.ts`:

```typescript
import { render, screen } from '@testing-library/react'
import { renderWithRedux } from '@/__tests__/components/redux-integration.test'

test('component with Redux', () => {
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
```

## 📝 Checklist de Integração

Para integrar Redux em um componente existente:

- [ ] Adicionar `'use client'` no topo
- [ ] Importar `useAppDispatch` e `useAppSelector`
- [ ] Importar actions e selectors necessários
- [ ] Substituir `useState` por Redux quando apropriado
- [ ] Usar `dispatch()` para modificar estado
- [ ] Usar `useAppSelector()` para ler estado
- [ ] Escrever testes para o componente

## 🔍 DevTools

Para usar Redux DevTools (requer extensão do navegador):

```typescript
// Já configurado automaticamente no store!
// Basta instalar a extensão do navegador:
// https://github.com/reduxjs/redux-devtools-extension
```

## 📚 Recursos Adicionais

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux Docs](https://react-redux.js.org/)
- [Jest Docs](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/)

## ⚠️ Boas Práticas

1. **Use Selectors**: Sempre use selectors para acessar estado
2. **Imutabilidade**: Redux Toolkit usa Immer, mas evite lógica complexa
3. **Testes**: Escreva testes para novos reducers e selectors
4. **TypeScript**: Aproveite a tipagem completa
5. **DevTools**: Use Redux DevTools para debug
6. **Ações Síncronas**: Para lógica complexa, use async thunks (futuro)

## 🐛 Troubleshooting

### Erro: "Cannot find module 'redux'"
Certifique-se de rodar `npm install`

### Componente não atualiza após dispatch
- Verifique se o componente tem `'use client'`
- Verifique se está usando `useAppSelector` corretamente
- Verifique se o reducer está modificando o estado

### Testes falham
- Certifique-se de rodar `npm install`
- Delete `node_modules` e `.next`, depois `npm install` novamente
- Verifique se os imports estão corretos
