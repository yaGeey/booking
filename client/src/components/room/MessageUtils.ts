import { socket } from '@/socket'
import { useState } from 'react'

export function handleTyping({ userId, roomId }: { userId: string; roomId: string }) {
   const [typingTimeoutState, setTypingTimeout] = useState<any | null>(null)
   const [value, setValue] = useState<string>('')
   const [isTyping, setIsTyping] = useState(false)

   function handleTypingInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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

   return { handleTypingInput, isTyping, value }
}
