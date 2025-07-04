import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { PrismaClient } from '../../generated/prisma'
import { generateSalt, hashPassword } from '../../lib/auth'
import { ErrorResponse } from '../../lib/errors'
import { sendEmailJob } from '../../queue/email'
import client from '../../redis/config'
import { createUserSession } from '../../redis/sessions'
const router = Router()
const prisma = new PrismaClient()

const pinVerificationLimiter = rateLimit({
   // TODO test this
   windowMs: 30 * 1000,
   max: 1,
   message: 'Too many requests, please try again later.',
})
const PIN_EXPIRATION_TIME = 60 * 60 * 1000

router.get('/:email', pinVerificationLimiter, async (req, res, next) => {
   try {
      const email = z.string().email().parse(req.params.email)
      // db
      const user = await prisma.user.findFirst({
         where: {
            email,
            password: { not: null },
         },
      })
      if (!user) throw new ErrorResponse('User not found', 404, { email: 'User not found' })

      // redis
      const pin = (Math.random() + 1).toString(36).substring(7).toUpperCase()
      await client.setEx(`pin:${user.id}`, PIN_EXPIRATION_TIME / 1000, pin)

      // send email
      const fetch_res = await fetch(`https://ipapi.co/${req.ip}/json/`) // TODO add this to queue
      const geo_data: any = await fetch_res.json()

      await sendEmailJob({
         email: user.email,
         data: {
            region: geo_data.region,
            user: { name: user.name, id: user.id },
            pin,
            ip: geo_data.ip,
         },
      })
      res.json(user.id)
   } catch (error) {
      next(error)
   }
})

router.post('/:userId/pin', async (req, res, next) => {
   try {
      const rawUserId = req.params.userId
      const rawPin = req.body.pin
      const { rawUserId: userId, rawPin: pin } = z
         .object({ rawUserId: z.string(), rawPin: z.string() })
         .parse({ rawUserId, rawPin })

      const serverPin = await client.get(`pin:${userId}`)
      if (!serverPin || pin !== serverPin.toUpperCase() || pin !== serverPin) {
         throw new ErrorResponse('Invalid or expired PIN', 400, { pin: 'Invalid or expired PIN' })
      }
      res.cookie('validation_pin', serverPin, {
         httpOnly: true,
         // secure: true,
         sameSite: 'lax',
         maxAge: PIN_EXPIRATION_TIME,
      }).json({ message: 'PIN is valid', data: serverPin })
   } catch (error) {
      next(error)
   }
})

router.patch('/:userId/new-password', async (req, res, next) => {
   try {
      const rawUserId = req.params.userId
      const rawNewPassword = req.body.newPassword // TODO: validate password
      const rawValidationPin = req.cookies.validation_pin

      const {
         rawUserId: userId,
         rawNewPassword: newPassword,
         rawValidationPin: validationPin,
      } = z
         .object({
            rawUserId: z.string(),
            rawNewPassword: z.string(),
            rawValidationPin: z.string().length(5),
         })
         .parse({ rawUserId, rawNewPassword, rawValidationPin })

      // check if user can change password
      const serverPin = await client.get(`pin:${userId}`)
      if (!serverPin || serverPin !== validationPin) throw new ErrorResponse('Invalid request', 405)

      // change password
      const salt = generateSalt()
      const user = await prisma.user.update({
         where: { id: userId },
         data: {
            password: await hashPassword(newPassword, salt),
            salt,
         },
      })
      res.clearCookie('validation_pin', {
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
      })

      await createUserSession({ id: user.id, role: user.role, cookie: res.cookie.bind(res) })
      res.status(201).send('Password updated successfully')
   } catch (error) {
      next(error)
   }
})

export default router
