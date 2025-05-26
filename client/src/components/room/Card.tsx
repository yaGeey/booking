import type { Room, RoomWithUsers } from '@/types'
import ClosedSVG from './closed.svg?react'
import { Link } from '@tanstack/react-router'

export default function Card({ data }: { data: RoomWithUsers }) {
   return (
      <Link to={`/rooms/$roomId`} params={{ roomId: data.id }}>
         <div className="bg-primary/30 rounded-lg border-primary border-3 py-3 px-4 flex flex-col shadow-md min-w-[300px] max-w-[400px]">
            <h2 className="font-semibold text-ellipsis text-left">{data.title}</h2>
            <p className="text-sm line-clamp-2">{data.desc}</p>
            <div className="flex items-center justify-between mt-2">
               {data.isPrivate && (
                  <div className="flex items-center gap-1.5">
                     {' '}
                     {/* TODO add by email pattern not just password */}
                     <ClosedSVG width={17} height={17} fill="#000" />
                     <span className="text-sm text-black/80">password</span>
                  </div>
               )}
               <div className="text-sm">{data.participants.length} users</div>
            </div>
         </div>
      </Link>
   )
}
