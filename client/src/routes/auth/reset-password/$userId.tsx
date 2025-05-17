import { Button, TextField } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import type { UserInput } from '@/types'

export const Route = createFileRoute('/auth/reset-password/$userId')({
   component: RouteComponent,
})

function RouteComponent() {
   const { userId } = Route.useParams()
   const navigate = useNavigate()

   const mutation = useMutation({
      mutationFn: async (userInput: Omit<UserInput, 'username'>) => {
         const res = await fetch(`${import.meta.env.VITE_SERVER_URI}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userInput),
            credentials: 'include',
         })
         const data = await res.json()
         if (!res.ok) throw new Error(data.message)
         navigate({ to: '/' })
      },
      onError: (error) => {
         console.error(error.message)
      },
   })

   function handleSubmit(rawData: FormData) {
      const data = Object.fromEntries(rawData)
      if (data.pin.toString().length !== 6) return
      // mutation.mutate(data as Omit<UserInput, 'username'>)
   }

   return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <form action={handleSubmit} className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg gap-5">
            <h1 className="text-2xl mb-4">Reset password</h1>
            <TextField name="email" label="email" required size="small" type="email" />
            <TextField name="pin" label="pin 6 numbers" required size="small" />
            <Button variant="contained" type="submit" className="mt-4" disabled={mutation.isPending}>
               Reset password
            </Button>
            <p className="text-red-500">{mutation.error?.message}</p>
         </form>
      </div>
   )
}
