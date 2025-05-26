import { getTime } from '@/lib/dates'
import type { LocalMessage, Message } from '@/types'
import { CircularProgress, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { twMerge as tw } from 'tailwind-merge'
import CheckMark from './check-mark.svg?react'

export function UserMessageLocal({ msg, status }: { msg: LocalMessage; status: 'pending' | 'error' }) {
   return (
      <div className="bg-primary/20 self-end relative flex flex-col px-3 py-1.5 rounded-2xl rounded-br-none min-w-[110px] max-w-3/5">
         <p className="-mt-0.5">{msg.text}</p>
         <span className="absolute bottom-1 right-1.5 text-sm text-black/80 flex items-center gap-1.5">
            {getTime(new Date(msg.createdAt))}
            {status === 'pending' && <CircularProgress size={12} />}
            {status === 'error' && <span className="text-red-600">✕</span>}
         </span>
      </div>
   )
}

export function UserMessage({
   msg,
   onDelete,
   onEdit,
   onReport,
}: {
   msg: Message
   onDelete: () => void
   onEdit: () => void
   onReport: () => void
}) {
   const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null)

   function handleContextMenu(e: React.MouseEvent) {
      e.preventDefault()
      setContextMenu((p) => (p === null ? { mouseX: e.clientX + 2, mouseY: e.clientY - 6 } : null))
   }

   return (
      <>
         <div
            className="bg-primary/20 self-end relative flex flex-col px-3 py-1.5 rounded-2xl rounded-br-none min-w-[110px] max-w-3/5"
            data-msgid={msg.id}
            data-senderid={msg.user.id}
            onContextMenu={handleContextMenu}
            style={{ cursor: 'context-menu' }}
         >
            <p className={tw('-mt-0.5 pr-14.5', msg.isEdited && 'pr-22')}>{msg.text}</p>
            <span className="absolute bottom-1 right-1.5 text-sm text-black/80 flex items-center gap-1.5">
               {getTime(msg.createdAt)}
               {msg.isEdited && <span className="text-[10px] self-end -ml-0.5">edited</span>}
               <CheckMark
                  width={12}
                  height={12}
                  fill={msg.isViewed ? 'blue' : '#000'}
                  data-tooltip-id={`tooltip-${msg.id}`}
                  data-tooltip-content={
                     msg.viewedBy?.length
                        ? msg.viewedBy!.map((v) => `At ${getTime(v.createdAt)} by ${v.user.name}`).join(', ')
                        : ''
                  }
                  onClick={(e) => {
                     console.log(msg.isViewed, msg.viewedBy)
                     e.stopPropagation()
                  }}
               />
            </span>

            <Menu
               open={contextMenu !== null}
               onClose={() => setContextMenu(null)}
               anchorReference="anchorPosition"
               anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
            >
               <MenuItem onClick={() => onEdit()}>Edit</MenuItem>
               <MenuItem onClick={() => onDelete()}>Delete</MenuItem>
               <MenuItem onClick={() => onReport()}>Report</MenuItem>
            </Menu>
         </div>
         {msg.isViewed && (
            <Tooltip id={`tooltip-${msg.id}`} place="top" style={{ fontSize: '12px', padding: '0 0.25rem', zIndex: 100000 }} />
         )}
      </>
   )
}
