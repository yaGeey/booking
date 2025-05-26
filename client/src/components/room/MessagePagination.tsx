import type { MessageMerged, Message as MessageType } from '@/types'
import { useMutation } from '@tanstack/react-query'
import { type Dispatch, type SetStateAction, useEffect } from 'react'

export default function handleMessagePaginataion({
   roomId,
   setMessages,
}: {
   roomId: string
   setMessages: Dispatch<SetStateAction<MessageMerged[]>>
}) {
   const mutation = useMutation({
      mutationFn: async (cursor: string) => {
         const res = await fetch(`http://localhost:8080/api/rooms/${roomId}?cursor=${cursor}`, {
            method: 'GET',
            credentials: 'include',
         })
         if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message)
         }
         const loadedMessages = await res.json()
         return loadedMessages
      },

      onSuccess: async (data) => {
         const previousScrollHeight = document.body.scrollHeight
         const previousScrollTop = window.scrollY

         const messages = data.messages.reverse()
         setMessages((p) => [...messages.map((msg: MessageType) => ({ data: msg, isLocal: false })), ...p])

         requestAnimationFrame(() => {
            const newScrollHeight = document.body.scrollHeight
            window.scrollTo(0, previousScrollTop + (newScrollHeight - previousScrollHeight))
         })
      },
   })

   useEffect(() => {
      const handleScroll = () => {
         if (window.pageYOffset === 0 && !mutation.isPending) {
            // TODO add threshold
            // console.log(document.body.scrollHeight - window.pageYOffset);
            const msg = document.querySelector('[data-msgid]')
            const msgId = msg?.getAttribute('data-msgid')
            mutation.mutate(msgId ?? '')
         }
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
   }, [])

   return mutation
}
