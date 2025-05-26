import prisma from '../prisma/client'
import redis from '../redis/config'
/*
TODO по хорошому воркер на BullMQ, але він працює тільки якщо локально розгортаєш redis сервер, 
а в мене редіс на upstash. Також, якби запускати це не в index.ts а на окремому файлі то можна
було б зробити мікросервіси якийсь імпленетувати, або на окремому сервері
*/
async function updateLastSeen() {
   const userIds = await redis.smembers('active_users')
   userIds.forEach(async (userId) => {
      const keyExists = await redis.exists(`user:active:${userId}`)
      if (keyExists) return
      await redis.srem('active_users', userId)
      await prisma.user.update({
         where: { id: userId },
         data: { lastSeen: new Date() },
      })
   })
}
setInterval(updateLastSeen, 1000 * 60 * 1)
