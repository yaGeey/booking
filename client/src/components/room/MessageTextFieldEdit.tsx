import { socket, useSocketEmit } from '@/socket'
import type { Message } from '@/types'
import { Button, TextField } from '@mui/material'
import { useState, type Dispatch, type SetStateAction } from 'react'

export default function MessageTextFieldEdit({
   userId,
   roomId,
   handleMessageEdit,
   setMsgEditing,
   msg,
}: {
   userId: string
   roomId: string
   handleMessageEdit: (messageId: string, text: string) => void
   setMsgEditing: Dispatch<SetStateAction<Message | null>>
   msg: Message
}) {
   const [value, setValue] = useState<string>(msg.text)
   const [typingTimeoutState, setTypingTimeout] = useState<any | null>(null)
   const [isTyping, setIsTyping] = useState(false)

   function handleTyping(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
      setValue(e.target.value)

      if (!isTyping) {
         setIsTyping(true)
         socket.emit('typing-start', { userId, roomId })
      }
      if (typingTimeoutState) clearTimeout(typingTimeoutState)
      const typingTimeout = setTimeout(() => {
         setIsTyping(false)
         socket.emit('typing-stop', { userId, roomId })
      }, 2000)
      setTypingTimeout(typingTimeout)
   }

   const { emit } = useSocketEmit('message-edit')
   function handleSendMessage() {
      if (!value.trim()) return
      handleMessageEdit(msg.id, value)

      emit({
         id: msg.id,
         text: value,
         roomId,
      })
      setValue('')
      setMsgEditing(null)
   }

   return (
      <div className="flex justify-center bg-white p-1.5 border-t border-gray-300">
         <TextField
            value={value}
            onChange={handleTyping}
            required
            size="small"
            className="w-full max-w-[500px]"
            onKeyDown={(e) => {
               if (e.key === 'Enter') handleSendMessage()
            }}
         />
         <Button variant="contained" type="submit" onClick={handleSendMessage}>
            Edit
         </Button>
      </div>
   )
}
