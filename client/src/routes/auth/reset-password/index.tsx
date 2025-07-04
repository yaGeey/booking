import { Button, TextField } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/auth/reset-password/')({
   component: RouteComponent,
})
// TODO handle errors and make code prettier by splitting into components
function RouteComponent() {
   const [step, setStep] = useState('default')
   const [userId, setUserId] = useState('')
   const [error, setError] = useState<string | null>(null)
   const [isLoading, setIsLoading] = useState(false)
   const navigate = useNavigate()

   async function handleSubmitEmail(email: string) {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/reset-password/${email}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.message || 'Failed to send email')
      setUserId(resData.data.id as string)
   }

   async function handleSubmit(rawData: FormData) {
      const data = Object.fromEntries(rawData)
      try {
         setIsLoading(true)
         if (step === 'default') {
            await handleSubmitEmail(data.email as string)
            setStep('emailSent')
         } else if (step === 'emailSent') {
            if (data.pin.toString().length !== 5) throw new Error('Pin must be 5 characters long')

            const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/reset-password/${userId}/pin`, {
               method: 'POST',
               body: JSON.stringify({
                  pin: data.pin,
               }),
               headers: { 'Content-Type': 'application/json' },
               credentials: 'include',
            })
            const resData = await res.json()
            if (!res.ok) throw new Error(resData.message || 'Failed to validate pin')
            setStep('pinSent')
         } else if (step === 'pinSent') {
            const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/reset-password/${userId}/new-password`, {
               method: 'PATCH',
               body: JSON.stringify({
                  newPassword: data.password,
               }),
               headers: { 'Content-Type': 'application/json' },
               credentials: 'include',
            })
            const resData = await res.json()
            if (!res.ok) throw new Error(resData.message || 'Failed to reset password')
            navigate({ to: '/' })
         } else {
            setError('Invalid step')
         }
      } catch (err: any) {
         console.error(err)
         setError(err.message || 'An error occurred')
      } finally {
         setIsLoading(false)
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
            {step === 'default' && <TextField name="email" label="email" required size="small" type="email" />}
            {step === 'emailSent' && (
               <>
                  <TextField name="pin" label="pin 5 characters" required size="small" />
                  <p className="text-sm text-gray-500">Check your email for the pin</p>
                  <Button variant="text" onClick={handleResendPin} disabled>
                     Resend pin
                  </Button>
               </>
            )}
            {step === 'pinSent' && <TextField name="password" label="new password" required size="small" type="password" />}

            <Button variant="contained" type="submit" className="mt-4" disabled={isLoading}>
               {step === 'default'
                  ? 'Send email'
                  : step === 'emailSent'
                    ? 'Send pin'
                    : step === 'pinSent'
                      ? 'Reset password'
                      : ''}
            </Button>
            {error && <p className="text-red-500">{error}</p>}
         </form>
      </div>
   )
}
