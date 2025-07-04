import { Resend } from 'resend'
import { ErrorResponse } from '../errors'
import passwordResetEmailHtml from './resendHTML'
import { EmailHTML } from './types'

export class ResendService {
   private resend: Resend
   constructor() {
      this.resend = new Resend(process.env.RESEND_API_KEY)
   }

   async resetPassword({ to, data }: { to: string; data: EmailHTML }) {
      const { error } = await this.resend.emails.send({
         from: 'onboarding@resend.dev',
         to,
         subject: `Password Reset Request`,
         html: passwordResetEmailHtml(data),
      })
      if (error) throw new ErrorResponse('Failed to send email', 500, error)
   }
}
