import { Button, TextField } from '@mui/material'
import { socket, useSocketEmit } from '@/socket'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Message, MessageMerged } from '@/types'
import type { DraftFunction } from 'use-immer'

export default function MessageTextField({
   userId,
   roomId,
   setMessages,
   setScrollTrigger,
}: {
   userId: string
   roomId: string
   setMessages: (arg: MessageMerged[] | DraftFunction<MessageMerged[]>) => void
   setScrollTrigger: React.Dispatch<React.SetStateAction<boolean>>
}) {
   const [value, setValue] = useState<string>('')
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

   const { emit, isPending, error, clearError } = useSocketEmit('send-message')
   function handleSendMessage() {
      if (!value.trim()) return
      const clientId = uuidv4()
      setMessages((d) => {
         d.push({
            data: { text: value, clientId, createdAt: new Date().toString() },
            isLocal: true,
            status: 'pending',
         })
      })

      emit({ text: value, roomId, clientMessageId: clientId }, (data: { message: Message }) => {
         setMessages((d) => {
            const i = d.findIndex((msg) => msg.isLocal && msg.data.clientId == clientId)
            d[i] = { data: data.message, isLocal: false }
         })
      })

      setValue('')
      setScrollTrigger((p) => !p)
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
            Send
         </Button>
      </div>
   )
}
