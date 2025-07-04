import { getAxiosErrMsg } from '@/lib/helpers'
import { Button, TextField } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import axios, { AxiosError } from 'axios'

type UserInput = {
   username: string
   email: string
   password: string
   avatar?: string
}
export interface ErrorWithFields extends Error {
   fields?: { [key: string]: Array<string> }
}

export const Route = createFileRoute('/auth/register')({
   component: RouteComponent,
})

function RouteComponent() {
   const navigate = useNavigate()

   const mutation = useMutation({
      mutationFn: async (userInput: UserInput) => {
         await axios.post(`${import.meta.env.VITE_SERVER_URI}/auth/login`, userInput, { withCredentials: true })
         navigate({ to: '/' })
      },
   })

   function handleSubmit(rawData: FormData) {
      const data = Object.fromEntries(rawData)
      mutation.mutate(data as UserInput)
   }

   return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <form className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg gap-5" action={handleSubmit}>
            <h1 className="text-2xl mb-4">Register</h1>
            <TextField name="name" label={'Name'} required size="small" />
            <TextField name="email" label={'Email'} required size="small" type="email" />
            <TextField name="password" label={'Password'} required size="small" type="password" />
            <Button variant="contained" type="submit" className="mt-4" disabled={mutation.isPending}>
               Sign Up
            </Button>
            <p className="text-red-500">{getAxiosErrMsg(mutation.error)}</p>
         </form>
         <Button variant="text" className="mt-4">
            <Link to="/auth/login">Sign In</Link>
         </Button>
      </div>
   )
}
