import Card from '@/components/room/Card'
import { getCurrentUser, logout } from '@/lib/auth'
import type { RoomWithUsers } from '@/types'
import { Button } from '@mui/material'
import { Link, createFileRoute } from '@tanstack/react-router'
import axios from 'axios'

export const Route = createFileRoute('/')({
   component: App,
   loader: async () => {
      const me = await getCurrentUser()
      if (!me) return { me: null, rooms: [] }
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URI}/rooms/my`, { withCredentials: true })
      return { me, rooms: res.data as RoomWithUsers[] }
   },
})

function App() {
   const { me, rooms } = Route.useLoaderData()
   if (!me)
      return (
         <div className="text-center">
            <main className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
               <Button>
                  <Link to="/auth/login">Sign In</Link>
               </Button>
               <Button>
                  <Link to="/auth/register">Sign Up</Link>
               </Button>
            </main>
         </div>
      )
   return (
      <div className="text-center">
         <main className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white">
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
         </main>
      </div>
   )
}
