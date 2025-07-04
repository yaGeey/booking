## About the App

### Authentication
* Session-based authentication using Redis
* OAuth implemented without external libraries
* Email verification via Resend service
* Password reset functionality

### Chat Rooms
* Load messages in batches of 50 using cursor pagination
* Track message read timestamps per user with automatic deletion of read data after some time
* Edit, delete, and report messages

### Tech Stack

#### 🖥️ Server
* Express
* Socket.IO
* Prisma ORM
* Zod
* Redis
* TODO: BullMQ

#### 🗄️ Database
* PostgreSQL with cronjobs
* Redis

#### 🔄 CI/CD and Deployment
* Docker
* Nginx
* GitHub Actions

#### Client
* React (Vite)
* TanStack Router
* Tailwind CSS
