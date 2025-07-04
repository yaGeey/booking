import Card from '@/components/room/Card'
import type { RoomWithUsers } from '@/types'
import { createFileRoute } from '@tanstack/react-router'
import axios from 'axios'

export const Route = createFileRoute('/rooms/')({
   component: RouteComponent,
   loader: async () => {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URI}/rooms/my`, { withCredentials: true })
      return res.data as RoomWithUsers[]
   },
})

function RouteComponent() {
   const rooms = Route.useLoaderData()
   return (
      <div className="flex flex-col gap-4">
         <h1 className="text-2xl font-semibold">Rooms</h1>
         <div className="flex flex-wrap gap-4">
            {rooms.map((room) => (
               <Card key={room.id} data={room} />
            ))}
         </div>
      </div>
   )
}
