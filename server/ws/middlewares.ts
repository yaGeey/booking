import type { Socket, ExtendedError } from "socket.io";
import { getUserSession } from "../redis/sessions";
import { io } from "../index"; // TODO fix circular dependency
import { markUserActive } from "../redis/activity";

export const authMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
   try {
      const { userId, sessionId } = socket.handshake.auth;
      if (!sessionId || !userId) return next(new Error("Unauthorized: Missing credentials"));

      const sessionServer = await getUserSession(sessionId);
      if (!sessionServer || sessionServer.id !== userId) {
         return next(new Error("Unauthorized: Session not found or invalid"));
      }

      socket.userId = userId;
      next();
   } catch (err) {
      console.error("Error in authMiddleware:", err);
      next(new Error(JSON.stringify(err)));
   }
};

export const userActivityMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
   try {
      await markUserActive(socket.userId);
      next();
   } catch (err) {
      console.error(err);
      next(new Error(JSON.stringify(err)));
   }
};
