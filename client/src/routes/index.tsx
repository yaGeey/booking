import { Button } from '@mui/material'
import { Link, createFileRoute, useLoaderData } from '@tanstack/react-router'
import { getCurrentUser, getCurrentUserFull, logout } from '@/lib/auth'
import Card from '@/components/room/Card'
import type { Room, RoomWithUsers } from '@/types'

export const Route = createFileRoute('/')({
   component: App,
   loader: async () => {
      const me = await getCurrentUserFull()
      if (!me) return { me: null, rooms: [] }
      const res = await fetch('http://localhost:8080/api/rooms/my', {
         method: 'GET',
         credentials: 'include',
      })
      if (!res.ok) {
         const error = await res.json()
         throw new Response(error.message, { status: res.status })
      }
      const rooms: RoomWithUsers[] = await res.json()
      return { me, rooms }
   },
})

function App() {
   const { me, rooms } = Route.useLoaderData()
   if (!me)
      return (
         <div className="text-center">
            <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
               <Button>
                  <Link to="/auth/login">Sign In</Link>
               </Button>
               <Button>
                  <Link to="/auth/register">Sign Up</Link>
               </Button>
            </header>
         </div>
      )
   return (
      <div className="text-center">
         <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white">
            <h1 className="text-lg">Welcome {me.name}</h1>
            <p>Your role: {me.role}</p>
            <Button
               onClick={async () => {
                  await logout()
                  window.location.reload()
               }}
            >
               Logout
            </Button>
            <h2 className="text-xl mb-2">Your Rooms</h2>
            <ul className="flex flex-col gap-2">
               {rooms.map((room) => (
                  <Card key={room.id} data={room} />
               ))}
            </ul>
         </header>
      </div>
   )
}
