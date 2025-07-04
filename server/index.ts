import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { onConnection } from './ws/index'
import { authMiddleware, userActivityMiddleware } from './ws/middlewares'

import { errorMiddleware } from './lib/errors'
import authRoutes from './routes/auth/auth'
import oauthRoutes from './routes/auth/oauth'
import resetPasswordRoutes from './routes/auth/reset-password'
import roomRoutes from './routes/rooms'
import userRoutes from './routes/user'

const corsOptions = {
   origin: ['http://localhost:3000', 'https://localhost', 'http://192.168.0.111:3000'],
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
   credentials: true,
   allowedHeaders: ['Content-Type', 'Authorization'],
}

const app = express()
const httpServer = createServer(app)
export const io = new Server(httpServer, { cors: corsOptions })

// middlewares
app.use(cors(corsOptions))
// app.options('/{*any}', cors(corsOptions)) // enable pre-flight requests for all routes
app.use(cookieParser())
app.use(express.json())
// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(helmet())

// app.use(
//    morgan('dev', {
//       skip: (req, res) => res.statusCode < 400,
//       stream: fs.createWriteStream(path.join(__dirname, 'logs/error.log'), { flags: 'a' }),
//    }),
// )
// app.use(
//    morgan('common', {
//       stream: fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' }),
//    }),
// )

// routes
app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/auth/reset-password', resetPasswordRoutes)
app.use(errorMiddleware)

// websocket
io.use(authMiddleware)
io.use(userActivityMiddleware)
io.on('connection', onConnection)

app.get('/', (req, res) => {
   res.send('Server is running')
})

httpServer.listen(8080, () => {
   console.log('Server is running')
})
