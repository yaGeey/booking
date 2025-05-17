import type { Socket } from "socket.io";
import prisma from "../prisma/client";
import { io } from "../index"; // TODO fix circular dependency
import { deleteUserActive, markUserActive } from "../redis/activity";

declare module "socket.io" {
   interface Socket {
      userId: string;
   }
}

const userSocketMap = new Map<string, Socket>();
export const onConnection = async (socket: Socket) => {
   console.log(socket.userId, "connected");
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
      const message = await prisma.message.findUnique({
         where: { id, isViewed: false },
         select: { userId: true },
      });
      if (!message) {
         console.log("Message not found or already viewed", id);
         return socket.emit("error", "Message not found or already viewed");
      }
      const data = await prisma.message.update({
         where: { id, isViewed: false },
         data: {
            isViewed: true,
            viewedAt: new Date(),
            viewedBy: { connect: { id: socket.userId } },
         },
         select: { userId: true },
      });
      const targetSocketId = userSocketMap.get(data.userId)?.id;
      io.to(targetSocketId!).emit("your-message-viewed", id);
   });

   socket.on("message-edit", async ({ id, text, roomId }: { id: string; text: string; roomId: string }) => {
      await prisma.message.update({
         where: { id },
         data: { text },
      });
      socket.to(roomId).emit("participant-message-edited", id, text); // TODO implement
   });
   socket.on("message-delete", async ({ id, roomId }: { id: string; roomId: string }) => {
      await prisma.message.update({
         where: { id },
         data: { isDeleted: true },
      });
      socket.to(roomId).emit("participant-message-deleted", id);
   });

   //* OTHER
   socket.on("ping", async () => {
      console.log(socket.userId, "marked as active");
      await markUserActive(socket.userId);
   });

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
   });
};
