import type { Socket } from 'socket.io'
import { z } from 'zod'
import { ReportReasons } from '../generated/prisma'
import { io } from '../index' // TODO fix circular dependency
import prisma from '../prisma/client'
import { deleteUserActive, markUserActive } from '../redis/activity'
import { errorHandler } from './middlewares'
// TODO add security

declare module 'socket.io' {
   interface Socket {
      userId: string
   }
}

const userSocketMap = new Map<string, Socket>()
export const onConnection = async (socket: Socket) => {
   console.log(socket.userId, 'connected')
   // await markUserActive(socket.userId);
   userSocketMap.set(socket.userId, socket)

   // TODO message delete, edit, reply, react etc
   //* MESSAGES
   socket.on(
      'send-message',
      await errorHandler(async ({ text, roomId, clientMessageId }: { [key: string]: string }, callback: any) => {
         z.object({ text: z.string(), roomId: z.string(), clientMessageId: z.string() }).parse({
            text,
            roomId,
            clientMessageId,
         })

         const message = await prisma.message.create({
            data: {
               text,
               userId: socket.userId,
               roomId,
            },
            include: { user: true },
         })

         socket.to(roomId).emit('receive-message', message)
         console.log(`User ${socket.userId} sent a message to room ${roomId}`)
         return { message }
      }),
   )

   socket.on(
      'message-viewed',
      await errorHandler(async (id: string) => {
         z.string().parse(id)
         // TODO view many
         const data = await prisma.message.update({
            where: {
               id,
               NOT: {
                  userId: socket.userId,
                  viewedBy: {
                     some: {
                        userId: socket.userId,
                     },
                  },
               },
            },
            data: {
               isViewed: true,
               viewedBy: {
                  connectOrCreate: {
                     where: {
                        messageId_userId: {
                           messageId: id,
                           userId: socket.userId,
                        },
                     },
                     create: {
                        userId: socket.userId,
                     },
                  },
               },
            },
            include: {
               viewedBy: {
                  include: { user: true },
               },
            },
         })
         const targetSocketId = userSocketMap.get(data.userId)?.id
         io.to(targetSocketId!).emit('your-message-viewed', id, data.viewedBy)
      }),
   )

   socket.on(
      'message-edit',
      await errorHandler(async ({ id, text, roomId }: { id: string; text: string; roomId: string }) => {
         z.object({ id: z.string(), text: z.string(), roomId: z.string() }).parse({ id, text, roomId })
         await prisma.message.update({
            where: {
               id,
               userId: socket.userId,
               NOT: { text },
            },
            data: { text, isEdited: true, lastEditedAt: new Date() },
         })
         socket.to(roomId).emit('participant-message-edited', id, text)
      }),
   )

   socket.on(
      'message-delete',
      await errorHandler(async ({ id, roomId }: { id: string; roomId: string }) => {
         z.object({ id: z.string(), roomId: z.string() }).parse({ id, roomId })
         await prisma.message.update({
            where: { id, userId: socket.userId },
            data: { isDeleted: true, deletedAt: new Date() },
         })
         socket.to(roomId).emit('participant-message-deleted', id)
      }),
   )

   //* MESSAGE REPORT
   socket.on(
      'message-report',
      await errorHandler(async ({ id, reason }: { id: string; reason: ReportReasons }) => {
         z.object({ id: z.string(), reason: z.string() }).parse({ id, reason })
         await prisma.message.update({
            where: {
               id,
               NOT: { userId: socket.userId },
            },
            data: {
               reports: {
                  connectOrCreate: {
                     where: {
                        messageId_userId: {
                           messageId: id,
                           userId: socket.userId,
                        },
                     },
                     create: {
                        userId: socket.userId,
                        reason,
                     },
                  },
               },
            },
         })
      }),
   )

   //* MESSAGE REACTION
   socket.on(
      // TODO not tested
      'message-reaction',
      await errorHandler(async ({ messageId, content, roomId }: { messageId: string; content: string; roomId: string }) => {
         z.object({ messageId: z.string(), content: z.string(), roomId: z.string() }).parse({
            messageId,
            content,
            roomId,
         })

         const existing = await prisma.reaction.findUnique({
            where: {
               messageId_userId: {
                  messageId,
                  userId: socket.userId,
               },
            },
         })

         let reaction
         if (existing) {
            reaction = await prisma.reaction.update({
               where: {
                  messageId_userId: {
                     messageId,
                     userId: socket.userId,
                  },
               },
               data: { content },
            })
         } else {
            reaction = await prisma.reaction.create({
               data: {
                  userId: socket.userId,
                  content,
                  messageId,
               },
            })
         }

         socket.to(roomId).emit('participant-message-reaction', reaction) // TODO implement on client
      }),
   )

   //* OTHER
   socket.on('ping', async () => {
      // console.log(socket.userId, "marked as active");
      await markUserActive(socket.userId)
   })

   //* ROOMS
   socket.on(
      'join-room',
      await errorHandler(async (roomId: string) => {
         z.string().parse(roomId)
         const participants = await prisma.room.findUnique({
            where: { id: roomId },
            select: { participants: { select: { id: true } } },
         })
         if (!roomId || !participants || !participants.participants.some((p) => p.id === socket.userId)) {
            throw new Error('You are not allowed to join this room')
         }
         socket.join(roomId)
         socket.to(roomId).emit('participant-joined-room', socket.userId) // TODO implement
      }),
   )

   socket.on(
      'leave-room',
      await errorHandler(async (roomId: string) => {
         z.string().parse(roomId)
         socket.leave(roomId)
         socket.to(roomId).emit('participant-left-room', socket.userId) // TODO implement
      }),
   )

   //* TYPING
   socket.on(
      'typing-start',
      await errorHandler(async ({ userId, roomId }: { userId: string; roomId: string }) => {
         z.object({ userId: z.string(), roomId: z.string() }).parse({ userId, roomId })
         const user = await prisma.user.findUnique({ where: { id: userId } })
         if (!user) throw new Error('User not found')
         socket.to(roomId).emit('participant-started-typing', { userId, name: user.name })
      }),
   )
   socket.on(
      'typing-stop',
      await errorHandler(async ({ userId, roomId }: { userId: string; roomId: string }) => {
         z.object({ userId: z.string(), roomId: z.string() }).parse({ userId, roomId })
         const user = await prisma.user.findUnique({ where: { id: userId } })
         if (!user) throw new Error('User not found')
         socket.to(roomId).emit('participant-stopped-typing', { userId, name: user.name })
      }),
   )

   //* SYSTEM
   socket.on('error', (err) => {
      console.error('Socket error:', err)
   })
   socket.on('disconnect', async () => {
      console.log(socket.userId, 'disconnected')
      userSocketMap.delete(socket.userId)
      await deleteUserActive(socket.userId)

      socket.rooms.forEach((roomId) => {
         socket.to(roomId).emit('participant-disconnected', socket.userId)
      })
   })
}
