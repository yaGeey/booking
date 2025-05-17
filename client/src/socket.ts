import { io } from 'socket.io-client'
import { useEffect } from 'react'
import { getCurrentUser } from './lib/auth'

// "undefined" means the URL will be computed from the `window.location` object
const URL = import.meta.env.NODE_ENV === 'production' ? undefined : 'http://localhost:8080'
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
