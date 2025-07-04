import { Queue, Worker } from 'bullmq'
import { ResendService } from '../lib/email/ResendService'
import connection from './queue'
import { EmailHTML } from '../lib/email/types';

const emailQueue = new Queue('email', { connection })

export async function sendEmailJob(data: { email: string; data: EmailHTML }) {
   await emailQueue.add('sendEmail', data, {
      attempts: 3,
      backoff: {
         type: 'exponential',
         delay: 1000,
      },
   })
}

const worker = new Worker(
   'email',
   async (job) => {
      const { email, data } = job.data
      console.log('Sending email to:', email)
      const resend = new ResendService()
      await resend.resetPassword({
         to: email,
         data,
      })
   },
   { connection },
)
