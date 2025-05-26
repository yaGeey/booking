import { PrismaClient } from '../generated/prisma'
const prisma = new PrismaClient({
   omit: {
      user: {
         password: true,
         salt: true,
         provider: true,
         providerId: true,
      },
   },
})
export default prisma
