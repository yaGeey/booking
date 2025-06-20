import { Router } from 'express'
import { Resend } from 'resend'
import { z } from 'zod'
import { PrismaClient } from '../../generated/prisma'
import { comparePassword, generateSalt, hashPassword } from '../../lib/auth'
import { ErrorResponse } from '../../lib/errors'
import { createUserSession, deleteUserSession, getUserSession } from '../../redis/sessions'
import getRandomColor from '../../utils/getRandomColor'
const router = Router()
// const resend = new Resend(process.env.RESEND_API_KEY)
const prisma = new PrismaClient()

router.get('/me', async (req, res, next) => {
   try {
      const sessionId = req.cookies.sessionId as string | undefined
      if (!sessionId) throw new ErrorResponse('Unauthorized', 401)

      const session = await getUserSession(sessionId)
      if (!session) throw new ErrorResponse('Session not found or expired', 401)

      if (req.query.getFullData && session) {
         const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true, avatar: true },
         })
         if (!user) throw new ErrorResponse('User not found', 404)

         res.json({ ...user, sessionId })
         return
      }

      res.json({ ...session, sessionId })
   } catch (error) {
      next(error)
   }
})

// TODO: add email verification and so vinesi in function Resend related stuff and on client make a reusable verification component
router.post('/register', async (req, res, next) => {
   try {
      const { name, email, password } = z
         .object({ name: z.string(), email: z.string().email(), password: z.string() })
         .parse(req.body)

      const existingUser = await prisma.user.findUnique({
         where: { email },
      })
      if (existingUser)
         throw new ErrorResponse('User with this email already exists', 400, { email: 'User with this email already exists' })

      const salt = generateSalt()
      const user = await prisma.user.create({
         data: {
            name,
            email,
            salt,
            password: await hashPassword(password, salt),
            avatarColor: getRandomColor(),
         },
      })

      await createUserSession({ id: user.id, role: user.role, cookie: res.cookie.bind(res) })
      res.status(201).json({ user })
   } catch (error) {
      next(error)
   }
})

router.post('/login', async (req, res, next) => {
   try {
      const user = await prisma.user.findFirst({
         where: {
            email: req.body.email,
            password: { not: null },
         },
      })
      if (!user) throw new ErrorResponse('User not found', 404, { email: 'User not found' })

      const isValidPassword = await comparePassword(req.body.password, user.password!, user.salt!)
      if (!isValidPassword) throw new ErrorResponse('Invalid password', 401, { password: 'Invalid password' })

      await createUserSession({ id: user.id, role: user.role, cookie: res.cookie.bind(res) })
      res.json({ message: 'Login successful' })
   } catch (error) {
      next(error)
   }
})

router.get('/logout', async (req, res, next) => {
   try {
      await deleteUserSession(req.cookies.sessionId, res.clearCookie.bind(res))
      res.json({ message: 'Logout successful' })
   } catch (error) {
      next(error)
   }
})

export default router
