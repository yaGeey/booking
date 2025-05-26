import { updateUserSession, getUserSession } from './redis/sessions'
import { Request, Response, NextFunction } from 'express'
import type { User } from './generated/prisma'

export interface AuthenticatedRequest extends Request {
   user?: Pick<User, 'id' | 'role'>
}

export async function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
   try {
      const sessionId: string | undefined = req.cookies.sessionId
      if (!sessionId) {
         res.status(401).json({ message: 'Unauthorized' })
         return
      }

      const session = await getUserSession(sessionId)
      if (!session) {
         res.status(401).json({ message: 'Session not found or expired' }) // TODO: what next user should do?
         return
      }
      await updateUserSession({ sessionId, user: session, cookie: res.cookie.bind(res) })

      req.user = { id: session.id, role: session.role }
      next()
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' })
   }
}

export async function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
   try {
      if (!req.user) {
         res.status(401).json({ message: 'Unauthorized' })
         return
      }

      if (req.user.role !== 'ADMIN') {
         res.status(403).json({ message: 'Forbidden' })
         return
      }

      next()
   } catch (error) {
      res.status(500).json({ message: 'Internal server error' })
   }
}
