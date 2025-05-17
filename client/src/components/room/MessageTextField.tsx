import { Button, TextField } from "@mui/material"
import { socket } from "@/socket"
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid'

export default function MessageTextField({ userId, roomId, setMessages, setScrollTrigger }: {
   userId: string,
   roomId: string,
   setMessages: React.Dispatch<React.SetStateAction<any[]>>,
   setScrollTrigger: React.Dispatch<React.SetStateAction<boolean>>,
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

   function handleSendMessage() {
      if (!value.trim()) return
      const clientId = uuidv4()
      setMessages((p) => [
         ...p,
         {
            data: { text: value, clientId, createdAt: new Date().toString() },
            isLocal: true,
            status: 'pending',
         },
      ])
      
      socket.emit('send-message', {
         text: value,
         roomId,
         clientMessageId: clientId,
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