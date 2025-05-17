import { Resend } from "resend";
import { ErrorResponse } from "../errors";

export class ResendService {
   private resend: Resend;
   constructor() {
      this.resend = new Resend(process.env.RESEND_API_KEY);
   }

   async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
      const { error } = await this.resend.emails.send({
         from: "onboarding@resend.dev",
         to,
         subject,
         html
      });
      if (error) throw new ErrorResponse("Failed to send email", 500, error);
   }
}