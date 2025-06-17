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
      ex: SESSION_EXPIRATION_TIME,
   })
   cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRATION_TIME * 1000,
   })
   console.log('redis cookie', cookie)
   return sessionId
}

export async function getUserSession(sessionId: string) {
   const user: UserSession | null = await redis.get(`session:${sessionId}`)
   if (!user) return null
   return user
}

export async function deleteUserSession(sessionId: string, clearCookie: any) {
   await redis.del(`session:${sessionId}`)
   clearCookie('sessionId', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
   })
}

export async function updateUserSession({ sessionId, user, cookie }: { sessionId: string; user: UserSession; cookie: Cookie }) {
   await redis.set(`session:${sessionId}`, JSON.stringify(user), {
      ex: SESSION_EXPIRATION_TIME,
   })
   cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRATION_TIME * 1000,
   })
}
