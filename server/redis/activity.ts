import redis from './config'

const INACTIVE_TIME = 60 * 3

// const subscriber = new Redis({
//    url: process.env.UPSTASH_REDIS_REST_URL,
//    token: process.env.UPSTASH_REDIS_REST_TOKEN,
// });
// subscriber.psubscribe("__keyevent@0__:expired");

export async function markUserActive(id: string) {
   await redis.sadd('active_users', id)
   await redis.set(`user:active:${id}`, '1', { expiration: { type: 'EX', value: INACTIVE_TIME } })
}

export async function getIsUserActive(id: string) {
   const res = await redis.get(`user:active:${id}`)
   return res === '1'
}

export async function deleteUserActive(id: string) {
   await redis.del(`user:active:${id}`)
}
