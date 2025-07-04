import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useRef, useState } from 'react'

export default function useAxios() {
   const axiosInstance = useRef<AxiosInstance>(
      axios.create({
         baseURL: import.meta.env.VITE_SERVER_URI,
         withCredentials: true,
         headers: {
            'Content-Type': 'application/json',
         },
         timeout: 10000, // default
      }),
   )

   const [loading, setLoading] = useState(false)
   const [error, setError] = useState<AxiosError | null>(null)
   const errorMessage = error ? (error.response?.data as any).message ?? error.response?.data ?? error.message : null
   const controller = useRef<AbortController | null>(null)

   axiosInstance.current.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
         // if (axios.isCancel(err)) console.warn('Request canceled:', err.message)
         // if (err.request.status == 401) { // TODO
         //    console.error('Unauthorized access - redirecting to login')
         //    window.location.href = '/auth/login'
         // }
         return Promise.reject(err)
      },
   )

   const request = async <T, Req = any>(config: AxiosRequestConfig<Req>): Promise<T> => {
      if (controller.current) controller.current.abort()
      controller.current = new AbortController()

      setLoading(true)
      setError(null)
      try {
         const response = await axiosInstance.current.request<T>({
            ...config,
            signal: controller.current.signal,
         })
         return response.data
      } catch (err) {
         setError(err as AxiosError)
         throw err
      } finally {
         setLoading(false)
      }
   }

   return { request, loading, error, errorMessage, controller: controller.current }
}
