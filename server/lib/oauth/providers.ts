import { z } from 'zod'
import { oAuthProviders } from '../../generated/prisma'
import OAuthClient from './oAuthClient'

// TODO add google provider atleast
export default function getOAuthProviders(
   cookie: (name: string, value: string, options?: Record<string, unknown>) => void,
   provider: oAuthProviders,
) {
   switch (provider) {
      case 'discord':
         return new OAuthClient({
            cookie,
            provider,
            urls: {
               auth: 'https://discord.com/oauth2/authorize',
               token: 'https://discord.com/api/oauth2/token',
               userData: 'https://discord.com/api/v10/users/@me',
            },
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            scope: ['identify', 'email'],
            userInfo: {
               schema: z.object({
                  id: z.string(),
                  global_name: z.string().nullable().optional(),
                  email: z.string().email(),
                  username: z.string(),
                  avatar: z.string().nullable(),
               }),
               parser: (user) => ({
                  id: user.id,
                  email: user.email,
                  name: user.global_name ?? user.username,
                  avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
               }),
            },
         })
      default:
         throw new Error(`Unsupported provider: ${provider}`)
   }
}
