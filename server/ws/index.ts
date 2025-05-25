import type { Socket } from "socket.io";
import prisma from "../prisma/client";
import { io } from "../index"; // TODO fix circular dependency
import { deleteUserActive, markUserActive } from "../redis/activity";
import { ReportReasons } from "../generated/prisma";
import { errorHandler } from "./middlewares";
// TODO add security
// TODO add zod validation

declare module "socket.io" {
   interface Socket {
      userId: string;
   }
}

const userSocketMap = new Map<string, Socket>();
export const onConnection = async (socket: Socket) => {
   console.log(socket.userId, "connected");
   // await markUserActive(socket.userId);
   userSocketMap.set(socket.userId, socket);

   // TODO message delete, edit, reply, react etc
   //* MESSAGES
   socket.on("send-message", async ({ text, roomId, clientMessageId }: { [key: string]: string }) => {
      try {
         const message = await prisma.message.create({
            data: {
               text,
               userId: socket.userId,
               roomId,
            },
            include: { user: true },
         });

         socket.to(roomId).emit("receive-message", message);
         socket.emit("message-success", {
            message,
            clientMessageId,
         });
         console.log(`User ${socket.userId} sent a message to room ${roomId}`);
      } catch (e) {
         console.error("Error sending message:", e);
         socket.emit("error", {
            message: "Error sending message",
            error: e,
            data: { clientId: clientMessageId },
         });
      }
   });

   socket.on("message-viewed", async (id) => {
      // TODO view many
      const data = await prisma.message.update({
         where: {
            id,
            NOT: {
               userId: socket.userId,
               viewedBy: {
                  some: {
                     userId: socket.userId,
                  },
               },
            },
         },
         data: {
            isViewed: true,
            viewedBy: {
               connectOrCreate: {
                  where: {
                     messageId_userId: {
                        messageId: id,
                        userId: socket.userId,
                     },
                  },
                  create: {
                     userId: socket.userId,
                  },
               },
            },
         },
         include: {
            viewedBy: {
               include: { user: true },
            },
         },
      });
      const targetSocketId = userSocketMap.get(data.userId)?.id;
      io.to(targetSocketId!).emit("your-message-viewed", id, data.viewedBy);
   });

   socket.on("message-edit", async ({ id, text, roomId }: { id: string; text: string; roomId: string }) => {
      await prisma.message.update({
         where: { id, userId: socket.userId },
         data: { text, isEdited: true, lastEditedAt: new Date() },
      });
      socket.to(roomId).emit("participant-message-edited", id, text);
   });

   socket.on("message-delete", async ({ id, roomId }: { id: string; roomId: string }) => {
      await prisma.message.update({
         where: { id, userId: socket.userId },
         data: { isDeleted: true, deletedAt: new Date() },
      });
      socket.to(roomId).emit("participant-message-deleted", id);
   });

   socket.on(
      "message-report",
      await errorHandler(async ({ id, reason }: { id: string; reason: ReportReasons }, callback: any) => {
         console.log("message-report");
         const msg = await prisma.message.update({
            where: {
               id,
               NOT: { userId: socket.userId },
            },
            data: {
               reports: {
                  connectOrCreate: {
                     where: {
                        messageId_userId: {
                           messageId: id,
                           userId: socket.userId,
                        },
                     },
                     create: {
                        userId: socket.userId,
                        reason,
                     },
                  },
               },
            },
         });
         console.log(msg);
         callback({ data: msg });
      }),
   );
   socket.on(
      "test-error",
      await errorHandler(() => {
         throw new Error("panic");
      }),
   );

   //* REACTION
   socket.on(
      "message-reaction",
      async ({ messageId, content, roomId }: { messageId: string; content: string; roomId: string }) => {
         const existing = await prisma.reaction.findUnique({
            where: {
               messageId_userId: {
                  messageId,
                  userId: socket.userId,
               },
            },
         });

         let reaction;
         if (existing) {
            reaction = await prisma.reaction.update({
               where: {
                  messageId_userId: {
                     messageId,
                     userId: socket.userId,
                  },
               },
               data: { content },
            });
         } else {
            reaction = await prisma.reaction.create({
               data: {
                  userId: socket.userId,
                  content,
                  messageId,
               },
            });
         }

         socket.to(roomId).emit("participant-message-reaction", reaction); // TODO implement on client
      },
   );

   //* OTHER
   socket.on("ping", async () => {
      // console.log(socket.userId, "marked as active");
      await markUserActive(socket.userId);
   });

   //* ROOMS
   socket.on("join-room", async (roomId) => {
      const participants = await prisma.room.findUnique({
         where: { id: roomId },
         select: { participants: { select: { id: true } } },
      });
      if (!roomId || !participants || !participants.participants.some((p) => p.id === socket.userId)) {
         console.log("You are not a participant of this room");
         return socket.emit("error", "You are not a participant of this room");
      }
      socket.join(roomId);
      socket.to(roomId).emit("participant-joined-room", socket.userId); // TODO implement
   });

   socket.on("leave-room", async (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("participant-left-room", socket.userId); // TODO implement
   });

   //* TYPING
   socket.on("typing-start", async ({ userId, roomId }) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return socket.emit("error", "User not found");
      socket.to(roomId).emit("participant-started-typing", { userId, name: user.name });
   });
   socket.on("typing-stop", async ({ userId, roomId }) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return socket.emit("error", "User not found");
      socket.to(roomId).emit("participant-stopped-typing", { userId, name: user.name });
   });

   //* SYSTEM
   socket.on("error", (err) => {
      console.error("Socket error:", err);
   });
   socket.on("disconnect", async () => {
      console.log(socket.userId, "disconnected");
      userSocketMap.delete(socket.userId);
      await deleteUserActive(socket.userId);

      socket.rooms.forEach((roomId) => {
         socket.to(roomId).emit("participant-disconnected", socket.userId);
      });
   });
};
