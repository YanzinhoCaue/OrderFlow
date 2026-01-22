import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'

/**
 * Este arquivo não precisa ser modificado.
 * Ele exporta hooks com tipos corretos para usar em toda a aplicação.
 * 
 * Use assim:
 * 
 * import { useAppDispatch, useAppSelector } from '@/store/hooks'
 * 
 * function MyComponent() {
 *   const dispatch = useAppDispatch()
 *   const myState = useAppSelector(selectMyState)
 *   // TypeScript sabe exatamente qual é o tipo de myState
 * }
 */

export const useDispatch = () => useReduxDispatch<AppDispatch>()

export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector
