import { getAxiosErrMsg } from '@/lib/helpers'
import type { UserInput } from '@/types'
import { Button, TextField } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { useState } from 'react'

export const Route = createFileRoute('/auth/login')({
   component: RouteComponent,
})

function RouteComponent() {
   const navigate = useNavigate()
   const [email, setEmail] = useState('')

   const mutation = useMutation({
      mutationFn: async (userInput: UserInput) => {
         await axios.post(`${import.meta.env.VITE_SERVER_URI}/auth/login`, userInput, { withCredentials: true })
         navigate({ to: '/' })
      },
   })

   async function handleSubmit(rawData: FormData) {
      const data = Object.fromEntries(rawData)
      mutation.mutate(data as Omit<UserInput, 'username'>)
   }

   async function handleDiscordLogin() {
      window.location.href = `${import.meta.env.VITE_SERVER_URI}/oauth/discord`
   }
   async function handlePasswordReset() {
      navigate({ to: '/auth/reset-password' })
   }

   return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <form action={handleSubmit} className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg gap-5">
            <h1 className="text-2xl mb-4">Login</h1>
            <TextField
               id="email"
               name="email"
               label="email"
               required
               size="small"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
            />
            <TextField name="password" label="password" required size="small" type="password" />
            <Button variant="contained" type="submit" className="mt-4" disabled={mutation.isPending}>
               Sign In
            </Button>
            <p className="text-red-500">{getAxiosErrMsg(mutation.error)}</p>
         </form>
         <Button variant="text" className="mt-4" onClick={handlePasswordReset}>
            Forgot your password?
         </Button>
         <Button variant="text" className="mt-4" onClick={handleDiscordLogin}>
            Sign in with Discord
         </Button>
         <Button variant="text" className="mt-4">
            <Link to="/auth/register">Sign Up</Link>
         </Button>
      </div>
   )
}
