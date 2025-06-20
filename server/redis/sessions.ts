import { randomBytes } from 'node:crypto'
import type { User } from '../generated/prisma'
import redis from './config'

export type UserSession = Pick<User, 'id' | 'role'>
type Cookie = (name: string, value: string, options?: Record<string, unknown>) => void
type UserSessionCookie = UserSession & { cookie: Cookie }

const SESSION_EXPIRATION_TIME = 60 * 60 * 24 * 7

export async function createUserSession({ id, role, cookie }: UserSessionCookie) {
   const sessionId = randomBytes(512).toString('hex').normalize()
   await redis.set(`session:${sessionId}`, JSON.stringify({ id, role }), {
      expiration: { type: 'EX', value: SESSION_EXPIRATION_TIME },
   })
   cookie('sessionId', sessionId, {
      httpOnly: true,
      // secure: true, // TODO temporary while no Nginx: enable this in production
      sameSite: 'lax',
      maxAge: SESSION_EXPIRATION_TIME * 1000,
   })
   return sessionId
}

export async function getUserSession(sessionId: string) {
   const sessionData = await redis.get(`session:${sessionId}`)
   const user: UserSession | null = sessionData ? JSON.parse(sessionData) : null
   if (!user) return null
   return user
}

export async function deleteUserSession(sessionId: string, clearCookie: any) {
   await redis.del(`session:${sessionId}`)
   clearCookie('sessionId', {
      httpOnly: true,
      // secure: true,
      sameSite: 'lax',
   })
}

export async function updateUserSession({ sessionId, user, cookie }: { sessionId: string; user: UserSession; cookie: Cookie }) {
   await redis.set(`session:${sessionId}`, JSON.stringify(user), {
      expiration: { type: 'EX', value: SESSION_EXPIRATION_TIME },
   })
   cookie('sessionId', sessionId, {
      httpOnly: true,
      // secure: true,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRATION_TIME * 1000,
   })
}
