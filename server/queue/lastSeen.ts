import { Queue, Worker } from 'bullmq'
import prisma from '../prisma/client'
import redis from '../redis/config'
import connection from './queue'

const lastSeenQueue = new Queue('lastSeen', { connection })

export async function updateLastSeen() {
   await lastSeenQueue.add(
      'updateLastSeen',
      {},
      {
         repeat: {
            every: 1000 * 30 * 1,
         },
         jobId: 'update-last-seen', // to avoid duplicate jobs
      },
   )
}

new Worker(
   'lastSeen',
   async (job) => {
      const userIds = await redis.sMembers('active_users')
      if (!Array.isArray(userIds)) return

      await Promise.all(
         userIds.map(async (userId) => {
            // async forEach - ?bad?
            if (typeof userId !== 'string') return
            const keyExists = await redis.exists(`user:active:${userId}`)
            if (keyExists) return
            await redis.srem('active_users', userId)
            await prisma.user.update({
               where: { id: userId },
               data: { lastSeen: new Date() },
            })
         }),
      )
   },
   { connection },
)

updateLastSeen()
