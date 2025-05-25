import { createFileRoute } from '@tanstack/react-router'
import { Button, TextField } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { LocalMessage, MessageMerged, Message as MessageType, Room, RoomWithUsers, SocketError, SocketResponse, User, ViewedBy } from '@/types'
import Message from '@/components/room/Message'
import { UserMessage, UserMessageLocal } from '@/components/room/UserMessage'
import { getCurrentUserFull } from '@/lib/auth'
import { socket, socketConnectDev, useSocketEmit, useSockets } from '@/socket'
import handleMessagePaginataion from '@/components/room/MessagePagination'
import MessageTextField from '@/components/room/MessageTextField'
import { useImmer } from 'use-immer';
import { handleTyping } from '@/components/room/MessageUtils'
import MessageTextFieldEdit from '@/components/room/MessageTextFieldEdit'

export const Route = createFileRoute('/rooms/$roomId')({
   component: RouteComponent,
   loader: async ({ params }) => {
      const me = await getCurrentUserFull()
      const resMsgs = await fetch(`http://localhost:8080/api/rooms/${params.roomId}`, {
         method: 'GET',
         credentials: 'include',
      })
      if (!resMsgs.ok) {
         const error = await resMsgs.json()
         throw new Error(error.message)
      }
      const fetchedData: { room: RoomWithUsers; messages: MessageType[] } = await resMsgs.json();
      return { me, fetchedData }
   },
})

function RouteComponent() {
   const navigate = Route.useNavigate()
   const { roomId } = Route.useParams()
   const { me, fetchedData } = Route.useLoaderData()
   if (!me) {
      navigate({ to: '/auth/login' })
      return null
   }

   const [messages, setMessages] = useImmer<Array<MessageMerged>>(
      fetchedData.messages.reverse().map((msg: MessageType) => ({
         data: msg,
         isLocal: false,
      })),
   )
   const [onlineUsers, setOnlineUsers] = useImmer<Array<string>>([me.id]) // TODO not working correctly sockets + add fetch from redis idk how but add it 
   const [typingUsers, setTypingUsers] = useImmer<Array<string>>([])
   const [scrollTrigger, setScrollTrigger] = useState(false)
   const [error, setError] = useState<string>('')
   const [msgEditing, setMsgEditing] = useState<MessageType | null>(null)
   const messagesEndRef = useRef<HTMLDivElement>(null)

   const { isPending, isError } = handleMessagePaginataion({ roomId, setMessages }) // TODO handle loading and error states

   socketConnectDev()
   useEffect(() => {
      socket.emit('join-room', roomId)
      window.scrollTo(0, document.body.scrollHeight)

      const cleanup = useSockets({
         'receive-message': (message: MessageType) => {
            setMessages((draft) => { draft.push({ data: message, isLocal: false }) })
            setScrollTrigger((p) => !p)
         },

         'message-success': ({ message, clientMessageId }: { message: MessageType; clientMessageId: string }) => {
            setMessages((draft) => {
               const index = draft.findIndex((msg) => msg.isLocal && msg.data.clientId == clientMessageId)
               draft[index] = { data: message, isLocal: false }
            })
         },

         'error': (err: string | SocketError) => {
            if (typeof err === 'string') {
               setError(err)
               return
            }
            setMessages((draft) => {
               const i = draft.findIndex((msg) => msg.isLocal && msg.data.clientId == err.data?.clientId);
               if (!draft[i].isLocal) return draft;
               draft[i].status = 'error'
            })
         },

         'your-message-viewed': (messageId: string, viewedBy: ViewedBy[]) => {
            setMessages((draft) => {
               const i = draft.findIndex((msg) => !msg.isLocal && msg.data.id == messageId)
               if (draft[i].isLocal || draft[i].data.isViewed) return
               draft[i].data.isViewed = true;
               draft[i].data.viewedBy = viewedBy;
            })
         },

         'participant-started-typing': (data: { userId: string; name: string }) => {
            console.log('typing', data)
            setTypingUsers((d) => {
               if (d.includes(data.name)) return;
               d.push(data.name);
            })
         },

         'participant-stopped-typing': (data: { userId: string; name: string }) => {
            setTypingUsers((d) => {
               const index = d.findIndex((name) => name === data.name);
               d.splice(index, 1);
            })
         },

         'participant-message-edited': (messageId: string, text: string) => { handleMessageEdit(messageId, text) },
         'participant-message-deleted': (messageId: string) => { handleMessageDelete(messageId) },

         'participant-joined-room': (userId: string) => { console.log(userId); setOnlineUsers((d) => { d.push(userId) }) },
         'participant-left-room': (userId: string) => {
            setOnlineUsers((d) => {
               const i = d.findIndex((u) => u === userId);
               d.splice(i, 1);
            })
         },
      })
      return cleanup;
   }, [])

   //* VIEW MESSAGE
   const [isFocused, setIsFocused] = useState(document.hasFocus());
   useEffect(() => {
      const handleFocus = () => setIsFocused(true);
      const handleBlur = () => setIsFocused(false);

      window.addEventListener("focus", handleFocus);
      window.addEventListener("blur", handleBlur);

      return () => {
         window.removeEventListener("focus", handleFocus);
         window.removeEventListener("blur", handleBlur);
      };
   }, []);

   useEffect(() => {
      if (!isFocused) return;
      const observer = new IntersectionObserver(
         (entries, observer) => {
            // TODO need to be triggered too on page load
            entries.forEach((entry) => {
               if (entry.isIntersecting) {
                  const msgId = entry.target.getAttribute('data-msgid')
                  const senderId = entry.target.getAttribute('data-senderid')
                  if (!msgId || !senderId || senderId == me.id) {
                     observer.unobserve(entry.target)
                     return
                  }
                  const msg = messages.find((msg) => !msg.isLocal && msg.data.id == msgId)
                  if (!msg?.isLocal && msg?.data.isViewed) {
                     observer.unobserve(entry.target)
                     return
                  }
                  socket.emit('message-viewed', msgId)
                  observer.unobserve(entry.target)
               }
            })
         },
         { threshold: 1.0 },
      )

      const messagesDivs = document.querySelectorAll('#messages')
      Array.from(messagesDivs).forEach((div) => {
         Array.from(div.children).forEach((child) => {
            observer.observe(child)
         })
      })
      return () => {
         Array.from(messagesDivs).forEach((div) => {
            Array.from(div.children).forEach((child) => {
               observer.unobserve(child)
            })
         })
      }
   }, [messages, isFocused])

   //* SCROLL TO BOTTOM
   useEffect(() => {
      if (messagesEndRef.current) {
         messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
         window.scrollTo(0, document.body.scrollHeight)
      }
   }, [scrollTrigger])

   //* MESSAGE DELETE/EDIT
   function handleMessageDelete(messageId: string) {
      setMessages((d) => {
         const i = d.findIndex((msg) => !msg.isLocal && msg.data.id == messageId)
         d.splice(i, 1);
      })
   }
   function handleMessageEdit(messageId: string, text: string) { // TODO implement
      setMessages((d) => {
         const i = d.findIndex((msg) => !msg.isLocal && msg.data.id == messageId)
         if (d[i].isLocal) return;
         d[i].data.isEdited = true
         d[i].data.text = text
      })
   }

   const { emit: msgReportEmit, isPending: isMsgReportPending, error: msgReportError, clearError } = useSocketEmit('message-report')
   function handleMessageReport(messageId: string) {
      if (confirm('Are you sure you want to report this message? Reason: other')) {
         // setMessages((d) => {
         //    const i = d.findIndex((msg) => !msg.isLocal && msg.data.id == messageId)
         //    if (d[i].isLocal) return;
         //    d[i].data.isReported = true;
         // })
         // socket.emit('message-report', { id: messageId, reason: 'other' }, (data: SocketResponse) => console.log(data))
         msgReportEmit({ id: messageId, reason: 'other' }, () => console.log('Message reported successfully'))
      }
   }

   return (
      <div>
         <header className='fixed top-0 left-0 w-full bg-white z-10 px-2 py-0.5 border-b border-gray-300 shadow-sm flex items-center justify-between'>
            <div>
               <h3 className='text-sm font-semibold'>{fetchedData.room.title}</h3>
               <h4 className='text-xs text-gray-500'>
                  {fetchedData.room.participants.length} participants
                  {onlineUsers.length > 1 && <span>, {onlineUsers.length} online</span>}
               </h4>
            </div>
            <div>
               <Button
                  className="text-sm font-semibold"
                  onClick={() => {
                     socket.disconnect()
                     navigate({ to: '/' })
                  }}
               >
                  Leave
               </Button>
            </div>
            {isMsgReportPending && <span className="text-xs text-gray-500">Reporting message...</span>}
            {msgReportError && <span className="text-xs text-red-500" onClick={()=>clearError()}>{msgReportError.message}</span>}
         </header>
         <main className="w-full flex flex-col p-4 overflow-x-hidden mb-15 mt-10">
            {error && <div>
               <h2 className="text-lg text-red-600 font-semibold">{error}</h2>
               <button className="text-red-600 font-bold" onClick={() => setError('')}>
                  ✕
               </button>
            </div>}
            <div>
               {
                  Object.entries(
                     Object.groupBy(messages, (msg) => (
                        new Date(msg.data.createdAt).toDateString().split(' ').slice(1, 3).join(' ')
                     ))
                  ).map(([date, messages], i) => (
                     <div id='messages' className='flex flex-col gap-2 w-full flex-1' key={i}>
                        <div className='my-4'>
                           <p className="text-center mb-1.5">{date}</p>
                           <hr className='text-black/10' />
                        </div>
                        {messages!.map((msg, j) => {
                           if (msg.isLocal) {
                              return <UserMessageLocal key={j} msg={msg.data} status={msg.status} />;
                           } else if (msg.data.userId === me.id) {
                              return <UserMessage key={j} msg={msg.data}
                                 onDelete={() => {
                                    handleMessageDelete(msg.data.id)
                                    socket.emit('message-delete', { id: msg.data.id, roomId })
                                 }}
                                 onEdit={() => setMsgEditing(msg.data)}
                                 onReport={() => handleMessageReport(msg.data.id)}
                              />;
                           } else {
                              return <Message key={j} message={msg.data} />;
                           }
                        })}
                     </div>
                  ))
               }
               <div ref={messagesEndRef}></div>
            </div>
         </main>
         {typingUsers.length > 0 &&
            <div className="fixed bottom-13 px-5 py-0.5 shadow-sm text-gray-500 text-xs w-full bg-white">
               <p>{typingUsers.join(', ')} is typing...</p>
            </div>
         }
         <footer className="fixed bottom-0 left-0 w-full shadow-md">
            {!msgEditing ?
               <MessageTextField
                  userId={me.id}
                  roomId={roomId}
                  setMessages={setMessages}
                  setScrollTrigger={setScrollTrigger}
               /> :
               <MessageTextFieldEdit
                  userId={me.id}
                  roomId={roomId}
                  handleMessageEdit={handleMessageEdit}
                  setMsgEditing={setMsgEditing}
                  msg={msgEditing}
               />
            }
         </footer>
      </div>
   )
}
