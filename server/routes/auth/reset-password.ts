import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { Resend } from 'resend'
import { z } from 'zod'
import { PrismaClient } from '../../generated/prisma'
import { generateSalt, hashPassword } from '../../lib/auth'
import passwordResetEmailHtml from '../../lib/email/resendHTML'
import { ErrorResponse } from '../../lib/errors'
import { createUserSession } from '../../redis/sessions'
const router = Router()
const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

const pinVerificationLimiter = rateLimit({
   // TODO test this
   windowMs: 30 * 1000,
   max: 1,
   message: 'Too many requests, please try again later.',
})
const PIN_EXPIRATION_TIME = 60 * 60 * 1000
// TODO add cronjobs to delete expired pins or move to redis

router.post('/:email', pinVerificationLimiter, async (req, res, next) => {
   try {
      // get email
      const rawEmail = req.params.email
      const email = z.string().email().safeParse(rawEmail).success ? rawEmail : null
      if (!email) throw new ErrorResponse('Email is required', 400)

      // db
      const user = await prisma.user.findFirst({
         where: {
            email,
            password: { not: null },
         },
      })
      if (!user) throw new ErrorResponse('User not found', 404, { email: 'User not found' })

      const pin = await prisma.passwordResetPin.create({
         data: {
            userId: user.id,
            pin: (Math.random() + 1).toString(36).substring(7).toUpperCase(),
            expiresAt: new Date(Date.now() + PIN_EXPIRATION_TIME),
         },
      })

      // send email
      const fetch_res = await fetch(`https://ipapi.co/${req.ip}/json/`)
      const geo_data: any = await fetch_res.json()

      const { error } = await resend.emails.send({
         from: 'onboarding@resend.dev',
         to: email,
         subject: 'Password reset',
         html: passwordResetEmailHtml({
            region: geo_data.region,
            user: { name: user.name, id: user.id },
            pin: pin.pin,
            ip: req.ip,
         }),
      })
      if (error) throw new ErrorResponse('Failed to send email', 500, error)
      res.json({ message: 'Email sent successfully', data: { id: user.id } })
   } catch (error) {
      next(error)
   }
})

router.post('/:userId/pin', async (req, res, next) => {
   try {
      const userId = req.params.userId
      const pin = req.body.pin
      const {
         data: body,
         success,
         error,
      } = z.object({ userId: z.string(), pin: z.string().length(5) }).safeParse({ userId, pin })
      if (!success) throw new ErrorResponse('Invalid input', 400, error.flatten().fieldErrors)

      const passwordResetPin = await prisma.passwordResetPin.findFirst({
         where: {
            userId: body.userId,
            pin: body.pin,
            expiresAt: { gte: new Date() },
         },
      })
      if (!passwordResetPin) throw new ErrorResponse('Invalid or expired PIN', 400, { pin: 'Invalid or expired PIN' })

      res.cookie('validation_pin', passwordResetPin.id, {
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
         maxAge: PIN_EXPIRATION_TIME,
      }).json({ message: 'PIN is valid', data: passwordResetPin })
   } catch (error) {
      next(error)
   }
})

router.patch('/:userId/new-password', async (req, res, next) => {
   try {
      const userId = req.params.userId
      const newPassword = req.body.newPassword // TODO: validate password
      const validationPin = req.cookies.validation_pin

      const {
         data: body,
         success,
         error,
      } = z
         .object({
            userId: z.string(),
            newPassword: z.string(),
            validationPin: z.string(),
         })
         .safeParse({ userId, newPassword, validationPin })
      if (!success) throw new ErrorResponse('Invalid input', 400, error.flatten().fieldErrors)

      // check if user can change password
      const passwordResetPin = await prisma.passwordResetPin.findUnique({
         where: { id: validationPin },
      })
      if (!passwordResetPin) throw new ErrorResponse('Invalid request', 405)

      // change password
      const salt = generateSalt()
      const user = await prisma.user.update({
         where: { id: body.userId },
         data: {
            password: await hashPassword(body.newPassword, salt),
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
