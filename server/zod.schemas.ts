import { z } from 'zod'

export const MessageSchema = z.object({
   text: z.string(),
   userId: z.string(),
   roomId: z.string(),
})

export const RoomSchema = z.object({
   title: z.string().optional(),
   desc: z.string().optional(),
   isPrivate: z.boolean().optional(),
   password: z.string().optional(),
   capacity: z.number().min(1).max(100).optional(),
   scheduledAt: z.date().optional(),
   durationMin: z.number().min(1).optional(),
   // messages: z.array(z.string()).optional(),
   // ownerId: z.string(),
})
