import IORedis from 'ioredis'

export default new IORedis({
   host: 'redis', // TODO redis_dev ?
   port: 6379,
   maxRetriesPerRequest: null,
})
