import { Button, TextField } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/auth/reset-password/')({
   component: RouteComponent,
})
// TODO handle errors and make code prettier by splitting into components
function RouteComponent() {
   const [status, setStatus] = useState<'default' | 'emailSent' | 'pinSent'>('default')
   const [userId, setUserId] = useState<string | null>(null) // TODO: handle as query - nuqs
   const navigate = useNavigate()

   async function handleSubmitEmail(email: string) {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/reset-password/${email}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
      if (!res.ok) throw new Error('Invalid email') // TODO: handle error
      const resData = await res.json()
      setStatus('emailSent')
      setUserId(resData.data.id as string)
   }

   async function handleSubmit(rawData: FormData) {
      const data = Object.fromEntries(rawData)

      if (status === 'default') {
         handleSubmitEmail(data.email as string)
      } else if (status === 'emailSent') {
         if (data.pin.toString().length !== 5) return
         const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/reset-password/${userId}/pin`, {
            method: 'POST',
            body: JSON.stringify({
               pin: data.pin,
            }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
         })
         // if (!res.ok) throw new Error('Invalid email')
         setStatus('pinSent')
      } else if (status === 'pinSent') {
         const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/reset-password/${userId}/new-password`, {
            method: 'PATCH',
            body: JSON.stringify({
               newPassword: data.password,
            }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
         })
         if (!res.ok) return
         navigate({ to: '/' })
      }
   }

   function handleResendPin(e: React.MouseEvent<HTMLButtonElement>) {
      // e.preventDefault()
      // setStatus('default')
      // handleSubmitEmail('')
   }

   return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <form action={handleSubmit} className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg gap-5">
            <h1 className="text-2xl mb-4">Reset password</h1>
            {status === 'default' && <TextField name="email" label="email" required size="small" type="email" />}
            {status === 'emailSent' && (
               <>
                  <TextField name="pin" label="pin 5 numbers" required size="small" />
                  <p className="text-sm text-gray-500">Check your email for the pin</p>
                  <Button variant="text" onClick={handleResendPin} disabled>
                     Resend pin
                  </Button>
               </>
            )}
            {status === 'pinSent' && <TextField name="password" label="password" required size="small" type="password" />}

            <Button variant="contained" type="submit" className="mt-4">
               {status === 'default'
                  ? 'Send email'
                  : status === 'emailSent'
                    ? 'Send pin'
                    : status === 'pinSent'
                      ? 'Reset password'
                      : ''}
            </Button>
            {/* <p className="text-red-500">{mutation.error?.message}</p> */}
         </form>
      </div>
   )
}
