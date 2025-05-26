import { getTime } from '@/lib/dates'
import type { Message } from '@/types'
import { Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { AvatarImg } from './Avatar'

export default function Message({ message, onReport }: { message: Message; onReport: () => void }) {
   const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null)

   function handleContextMenu(e: React.MouseEvent) {
      e.preventDefault()
      setContextMenu((p) => (p === null ? { mouseX: e.clientX + 2, mouseY: e.clientY - 6 } : null))
   }
   return (
      <div
         className="flex items-end gap-2 min-w-[230px] w-fit max-w-3/5"
         data-msgid={message.id}
         data-senderid={message.user.id}
         onContextMenu={handleContextMenu}
         style={{ cursor: 'context-menu' }}
      >
         <AvatarImg user={message.user} />
         <div className="bg-primary/20 relative flex flex-col px-3 py-1.5 rounded-2xl rounded-bl-none">
            <h3 style={{ color: message.user.avatarColor }} className="font-semibold">
               {message.user.name}
            </h3>
            <p className={tw('-mt-0.5 pr-10', message.isEdited && 'pr-17.5')}>{message.text}</p>
            <span className="absolute bottom-1 right-1.5 text-sm text-black/80">
               {getTime(message.createdAt)}
               {message.isEdited && <span className="text-[10px] ml-0.5">edited</span>}
            </span>
         </div>

         <Menu
            open={contextMenu !== null}
            onClose={() => setContextMenu(null)}
            anchorReference="anchorPosition"
            anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
         >
            <MenuItem onClick={() => onReport()}>Report</MenuItem>
         </Menu>
      </div>
   )
}
