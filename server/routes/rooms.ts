import { Router } from "express";
import { verifyAdmin, verifyAuth } from "../middlewares";
import { ErrorResponse } from "../lib/errors";
import type { AuthenticatedRequest } from "../middlewares";
import { RoomSchema } from "../zod.schemas";
import prisma from "../prisma/client";

const router = Router();
router.use(verifyAuth);

router.get("/my", async (req: AuthenticatedRequest, res, next) => {
   try {
      const userId = req.user!.id;
      const rooms = await prisma.room.findMany({
         where: {
            OR: [{ ownerId: userId }, { participants: { some: { id: userId } } }],
         },
         include: {
            owner: true,
            participants: true,
         },
      });
      res.json(rooms);
   } catch (e) {
      next(e);
   }
});

router.get("/:roomId", async (req: AuthenticatedRequest, res, next) => {
   try {
      const roomId = req.params.roomId;
      const userId = req.user!.id;
      const cursorId = req.query.cursor as string | undefined;
      const take = Math.min(Number(req.query.take) || 25, 25);
      console.log("cursorId", cursorId);

      const room = await prisma.room.findUnique({
         where: {
            id: roomId,
            participants: { some: { id: userId } },
         },
         include: {
            owner: true,
            participants: true,
         },
      });
      if (!room) throw new ErrorResponse("Room not found or you are not a participant", 400);

      const messages = await prisma.message.findMany({
         where: { roomId, isDeleted: false },
         include: {
            user: true,
            viewedBy: {
               include: { user: true },
            },
         },
         orderBy: { createdAt: "desc" },
         take,
         skip: cursorId ? 1 : 0,
         ...(cursorId ? { cursor: { id: cursorId } } : {}),
      });

      res.json({ room, messages }); // TODO add hasMore
   } catch (e) {
      next(e);
   }
});

router.post("/", async (req: AuthenticatedRequest, res, next) => {
   try {
      const input = RoomSchema.parse(req.body);
      const room = await prisma.room.create({
         data: {
            ...input,
            ownerId: req.user!.id,
         },
      });

      res.status(201).json(room);
   } catch (error) {
      next(error);
   }
});

router.get("/", verifyAdmin, async (req: AuthenticatedRequest, res, next) => {
   try {
      const rooms = await prisma.room.findMany({
         include: { owner: true },
      });
      res.json(rooms);
   } catch (e) {
      next(e);
   }
});

router.patch("/:roomId/participants", async (req: AuthenticatedRequest, res, next) => {
   try {
      const { roomId } = req.params;
      const { userId, action } = req.body; // action can be 'add' or 'remove'

      if (action === "add") {
         await prisma.room.update({
            where: { id: roomId },
            data: {
               participants: {
                  connect: { id: userId },
               },
            },
         });
      } else if (action === "remove") {
         await prisma.room.update({
            where: { id: roomId },
            data: {
               participants: {
                  disconnect: { id: userId },
               },
            },
         });
      } else {
         throw new ErrorResponse("Invalid action", 400);
      }

      res.status(200).json("Participant updated successfully");
   } catch (error) {
      next(error);
   }
});

export default router;
