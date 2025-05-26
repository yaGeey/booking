import Card from '@/components/room/Card'
import type { Room, RoomWithUsers } from '@/types'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rooms/')({
   component: RouteComponent,
   loader: async () => {
      const res = await fetch(`http://localhost:8080/api/rooms/my`, {
         method: 'GET',
         credentials: 'include',
      })
      return (await res.json()) as Array<RoomWithUsers>
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
