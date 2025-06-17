import { useCallback, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { getCurrentUser } from './lib/auth'
import type { SocketResponse } from './types'

// "undefined" means the URL will be computed from the `window.location` object
// const URL = import.meta.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8080'
const URL = import.meta.env.VITE_SERVER_URI.split('/api')[0] // TODO temp
const user = await getCurrentUser() // TODO mb tut ne treba do redisa, mb prosto z cookiesiv

export const socket = io(URL, {
   withCredentials: true,
   auth: {
      userId: user?.id,
      sessionId: user?.sessionId,
   },
   autoConnect: true,
   transports: ['websocket'],
})

export function socketConnectDev() {
   useEffect(() => {
      socket.connect()
      return () => {
         socket.disconnect()
      }
   }, [])
}

export function useSockets(handlers: Record<string, (...args: any[]) => void>) {
   Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler)
   })
   return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
         socket.off(event, handler)
      })
   }
}

// TODO implement, not tested
export function useSocketEmit(name: string, errMsg?: string) {
   const [isPending, setIsPending] = useState(false)
   const [error, setError] = useState<null | Extract<SocketResponse, { ok: false }>>(null)

   const emit = useCallback(
      (data: { [key: string]: string }, cb?: (...args: any[]) => void) => {
         setIsPending(true)
         socket.emit(name, data, (res: SocketResponse) => {
            setIsPending(false)
            if (res.ok) {
               cb?.(res.data)
            } else {
               if (errMsg) res.message = errMsg
               console.error(res)
               setError(res)
               // TODO Handle the error as needed, e.g., show a notification (toastify)
            }
         })
      },
      [name],
   )
   const clearError = useCallback(() => setError(null), [])

   return { emit, isPending, error, clearError }
}
