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
   isViewed: boolean
   viewedAt?: string
   viewedBy?: User[]
   isDeleted: boolean
   isEdited: boolean
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

export type MessageMerged =
   | { data: LocalMessage; isLocal: true; status: 'pending' | 'error' }
   | { data: Message; isLocal: false }

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