import type { User } from '@/types'
// TODO validate normally with Result types please it's no awful

type UserRedis = Pick<User, 'id' | 'role'>
type RedisWithSessionId = UserRedis & { sessionId: string }
type UserWirhSessionId = User & { sessionId: string }

export async function logout() {
   try {
      await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/logout`, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
   } catch (error) {
      console.error(error)
   }
}

export async function getCurrentUser(redirectIfNotAuthenticated: boolean = false): Promise<RedisWithSessionId | null> {
   try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/session`, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user session')
      if (redirectIfNotAuthenticated && !data.id) {
         window.location.href = '/auth/login'
         return null
      }
      return data as RedisWithSessionId
   } catch (error) {
      console.error(error)
      if (redirectIfNotAuthenticated) {
         window.location.href = '/auth/login'
      }
      return null
   }
}

export async function getCurrentUserFull(redirectIfNotAuthenticated: boolean = false): Promise<UserWirhSessionId | null> {
   try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/me`, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user session')
      if (redirectIfNotAuthenticated && !data.id) {
         window.location.href = '/auth/login'
         return null
      }
      return data as UserWirhSessionId
   } catch (error) {
      console.error(error)
      if (redirectIfNotAuthenticated) {
         window.location.href = '/auth/login'
      }
      return null
   }
}
