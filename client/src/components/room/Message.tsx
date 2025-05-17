import type { Message } from '@/types'
import { AvatarImg } from './Avatar'

export default function Message({ message }: { message: Message }) {
   return (
      <div
         className="flex items-end gap-2 min-w-[230px] w-fit max-w-3/5"
         data-msgid={message.id}
         data-senderid={message.user.id}
      >
         <AvatarImg user={message.user} />
         <div className="bg-primary/20 relative flex flex-col px-3 py-1.5 rounded-2xl rounded-bl-none">
            <h3
               style={{ color: message.user.avatarColor }}
               className="font-semibold"
            >{message.user.name}</h3>
            <p className="-mt-0.5 pr-10">{message.text}</p>
            <span className="absolute bottom-1 right-1.5 text-sm text-black/80">
               {new Date(message.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
               })}
               {message.isEdited && <span className='text-[10px]'>edited</span>}
            </span>
         </div>
      </div>
   )
}
