import type { User } from '@/types'
import { useState } from 'react'
import { Tooltip } from 'react-tooltip'

export function AvatarNoImg({ user }: { user: User }) {
   return (
      <div
         style={{ backgroundColor: user.avatarColor }}
         className="rounded-full min-h-[38px] min-w-[38px] flex justify-center items-center text-xl font-semibold text-white"
      >
         {user.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
      </div>
   )
}
export function AvatarImg({ user }: { user: User }) {
   const [hasError, setHasError] = useState(false)
   if (hasError || !user.avatar) return <AvatarNoImg user={user} />
   return (
      <>
         <img
            src={user.avatar}
            alt="avatar"
            className="rounded-full size-[38px] object-cover"
            onError={() => setHasError(true)}
            data-tooltip-id={`tooltip-${user.id}`}
            data-tooltip-content={`is active`}
         />
         <Tooltip id={`tooltip-${user.id}`} place="top" style={{ fontSize: '12px', padding: '0 0.25rem', zIndex: 100000 }} />
      </>
   )
}
