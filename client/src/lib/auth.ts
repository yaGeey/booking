import type { User } from '@/types'

type UserRedis = Pick<User, 'id' | 'role'>

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
// TODO FIX always returns full user
export async function getCurrentUser(
   redirectIfNotAuthenticated: boolean = false,
): Promise<(UserRedis & { sessionId: string }) | null> {
   try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/me?getFullData=false`, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      if (redirectIfNotAuthenticated && !data.id) {
         window.location.href = '/auth/login'
      }
      return data
   } catch (error) {
      console.error(error)
      return null
   }
}

export async function getCurrentUserFull(redirectIfNotAuthenticated: boolean = false): Promise<User | null> {
   try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/me?getFullData=true`, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      if (!data.id) {
         if (redirectIfNotAuthenticated) window.location.href = '/auth/login'
         return null
      }

      return data as User
   } catch (error) {
      console.error(error)
      return null
   }
}
