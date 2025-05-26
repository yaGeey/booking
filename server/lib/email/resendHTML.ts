export default function passwordResetEmailHtml({
   region,
   user,
   pin,
   ip,
}: {
   region: string
   user: { name: string; id: string }
   pin: string
   ip?: string
}) {
   return `
   <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
         <h2 style="color: #333;">🔒 Password Reset Request</h2>
         <p style="font-size: 16px; color: #555;">Hi <strong>${user.name}</strong>,</p>
         <p style="font-size: 16px; color: #555;">
            We received a request to reset your password from:
         </p>
         <p style="font-size: 16px; color: #555;"><strong>${region} - ${ip}</strong></p>
         <p style="font-size: 16px; color: #555;">
            If you didn't make this request, you can safely ignore this email.
         </p>
         <p style="font-size: 16px; color: #555;">
            If you did, click the button below to reset your password:
         </p>
         <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/auth/reset-password/${user.id}"
               style="background-color: #4CAF50; color: white; padding: 14px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
               Reset Password
            </a>
         </div>
         <p style="font-size: 16px; color: #555;">Or use this PIN-code in the app:</p>
         <p style="font-size: 24px; font-weight: bold; color: #000; text-align: center;">${pin}</p>
         <p style="font-size: 14px; color: #888;">This code will expire in 1 hour.</p>
         <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
         <p style="font-size: 12px; color: #aaa; text-align: center;">If you have questions, contact our support team.</p>
      </div>
   </div>
`
}
