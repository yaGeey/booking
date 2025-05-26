import type { ExtendedError, Socket } from 'socket.io'
import { ZodError } from 'zod'
import { markUserActive } from '../redis/activity'
import { getUserSession } from '../redis/sessions'

export const authMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
   try {
      const { userId, sessionId } = socket.handshake.auth
      if (!sessionId || !userId) return next(new Error('Unauthorized: Missing credentials'))

      const sessionServer = await getUserSession(sessionId)
      if (!sessionServer || sessionServer.id !== userId) {
         return next(new Error('Unauthorized: Session not found or invalid'))
      }

      socket.userId = userId
      next()
   } catch (err) {
      console.error('Error in authMiddleware:', err)
      next(new Error(JSON.stringify(err)))
   }
}

export const userActivityMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
   try {
      await markUserActive(socket.userId)
      next()
   } catch (err) {
      console.error(err)
      next(new Error(JSON.stringify(err)))
   }
}

// TODO розібратися
export const errorHandler = async (handler: any) => {
   const handleError = (err: any, cb?: (...args: any[]) => void) => {
      let cbData

      if (typeof err === 'object' && err !== null) {
         //* Prisma
         if ('meta' in err) {
            // TODO add handler to unexpected prisma errors
            cbData = {
               type: 'PRISMA_ERROR',
               message: err.meta.cause || err.message,
            }
         }
         //* Zod
         else if (err instanceof ZodError) {
            cbData = {
               type: 'VALIDATION_ERROR',
               data: err.flatten().fieldErrors,
            }
         }
         //* String error
         else {
            cbData = {
               type: 'MESSAGE_ERROR',
               message: err.message || 'Unexpected error',
            }
         }
      }

      if (!cbData)
         cbData = {
            type: 'UNEXPECTED_ERROR',
            message: 'Unexpected error',
         }
      console.log(cbData)
      if (cb) cb({ ok: false, error: err, ...cbData })
   }

   return (...args: any[]) => {
      const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined

      try {
         // this - це контекст, в якому викликали обгортку
         const ret = handler.apply(this, args) // handler(1,2,3), а якби handler(args) => handler([1,2,3]) + this нам важливий
         if (ret && typeof ret.catch === 'function') {
            ret.then((data: any) => {
               if (cb) cb({ ok: true, data })
            }).catch((err: unknown) => handleError(err, cb))
         } else if (cb) {
            cb({ ok: true })
         }
      } catch (e) {
         // sync handler
         handleError(e, cb)
      }
   }
}
