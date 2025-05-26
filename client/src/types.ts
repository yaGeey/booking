import { ZodError } from 'zod'

export type UserInput = {
   username: string
   email: string
   password: string
   avatar?: string
}
export type User = {
   id: string
   name: string
   email: string
   role: 'USER' | 'ADMIN'
   createdAt: string
   updatedAt: string
   avatar?: string
   avatarColor: string
}
export type Message = {
   id: string
   text: string
   createdAt: string
   updatedAt: string
   roomId: string
   userId: string
   user: User

   isDeleted: boolean
   deletedAt: boolean
   isEdited: boolean
   lastEditedAt: boolean

   isViewed: boolean
   viewedBy?: ViewedBy[]

   reactions?: {
      content: string
      updatedAt: string
      userId: string
      user: User
   }[]

   isReported: boolean
}
export type ViewedBy = {
   createdAt: string
   user: User
}
export type LocalMessage = {
   text: string
   clientId: string
   createdAt: string
}

export type SocketError = {
   message: string
   error: any
   data?: { [key: string]: string }
}

export type MessageMerged = { data: LocalMessage; isLocal: true; status: 'pending' | 'error' } | { data: Message; isLocal: false }

export type Room = {
   id: string
   title?: string
   desc?: string
   isPrivate: boolean
   password?: string
   capacity?: number
   scheduleAt?: string
   durationMin?: number
   createdAt: string
   updatedAt: string
   ownerId: string
}
export type RoomWithUsers = Room & { participants: Array<User> }

export enum ReportReasons {
   spam,
   harassment,
   hateSpeech,
   nudityOrSexualContent,
   violenceOrThreats,
   misinformation,
   scamOrFraud,
   selfHarmOrSuicide,
   impersonation,
   other,
}

export type SocketResponseSuccess = {
   ok: true
   type: 'SUCCESS'
   data?: any
   message?: string
}
export type SocketResponse =
   | SocketResponseSuccess
   | {
        ok: false
        type: 'PRISMA_ERROR'
        error: {
           code?: string
           meta?: { [key: string]: any }
           message: string
        }
        message: string
     }
   | {
        ok: false
        type: 'UNEXPECTED_ERROR'
        error: any
        message: string
     }
   | {
        ok: false
        type: 'VALIDATION_ERROR'
        error: ZodError
        data: { [key: string]: string[] }
        message: string
     }
   | {
        ok: false
        type: 'MESSAGE_ERROR'
        message: string
     }
