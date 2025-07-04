// TODO
type Result<T, E> = { success: true; data: T } | { success: false; error: E }
type FetchError = {
   message: string
   [key: string]: any
}

export default async function useFetch() {
   const fetchWithTimeout = async <T>(url: string, options: RequestInit, timeout = 5000): Promise<Result<T, FetchError>> => {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)

      try {
         const response = await fetch(url, { ...options, signal: controller.signal })
         clearTimeout(id)

         if (!response.ok) {
            const errorData = await response.json()
            return { success: false, error: { message: errorData.message || 'An error occurred', ...errorData } }
         }

         const data = await response.json()
         return { success: true, data }
      } catch (error: any) {
         if (error.name === 'AbortError') {
            return { success: false, error: { message: 'Request timed out' } }
         }
         return { success: false, error: { message: error.message || 'An unexpected error occurred' } }
      }
   }

   return { fetchWithTimeout }
}
