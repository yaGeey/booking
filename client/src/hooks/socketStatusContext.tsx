import { createContext, useContext } from 'react'
import { useImmerReducer, type ImmerReducer } from 'use-immer'

type State = Record<
   string,
   {
      isPending: boolean
      error: string | null
   }
>
type Action =
   | { type: 'SET_PENDING'; name: string; isPending: boolean }
   | { type: 'SET_ERROR'; name: string; error: string | null }

const SocketStatusContext = createContext<{
   state: State
   dispatch: React.Dispatch<Action>
} | null>(null)

const reducer: ImmerReducer<State, Action> = (d, action) => {
   const entry = d[action.name] ?? {}
   switch (action.type) {
      case 'SET_PENDING':
         d[action.name] = {
            ...entry,
            isPending: action.isPending,
            error: action.isPending ? null : entry.error,
         }
         break
      case 'SET_ERROR':
         d[action.name] = {
            ...entry,
            isPending: false,
            error: action.error,
         }
         break
   }
}

export function SocketStatusProvider({ children }: { children: React.ReactNode }) {
   const [state, dispatch] = useImmerReducer(reducer, {})
   return <SocketStatusContext.Provider value={{ state, dispatch }}>{children}</SocketStatusContext.Provider>
}

export function useSocketStatus() {
   const context = useContext(SocketStatusContext)
   if (!context) throw new Error('useSocketStatus must be used within a SocketStatusProvider')
   return context
}
