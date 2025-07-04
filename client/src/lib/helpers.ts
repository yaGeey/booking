import type { AxiosError } from 'axios'

export const getAxiosErrMsg = (err: Error | null): string => {
   return ((err as AxiosError)?.response?.data as any)?.message ?? (err as AxiosError)?.response?.data ?? err?.message
}
