import { Router } from 'express';
import multer from 'multer';
import { getStorage, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { initializeApp } from "firebase/app";
import firebaseConfig from '../configs/firebase';
import { PrismaClient } from '../generated/prisma/index.js';
import { verifyAuth } from '../middlewares';
import { ErrorResponse } from '../lib/errors';
import prisma from '../prisma/client';

const upload = multer({ storage: multer.memoryStorage() });
initializeApp(firebaseConfig);
const storage = getStorage();
const router = Router();

// TODO: not working?
router.post('/avatar', upload.single('userAvatar'), async (req, res, next) => {
   try {
      console.log('meow')
      if (!req.file || !req.body.id) throw new ErrorResponse("Invalid input", 400);

      const storageRef = ref(storage, `avatars/${Date.now()}_${req.file.originalname}`);
      const snapshot = await uploadBytesResumable(storageRef, req.file.buffer);
      const url = await getDownloadURL(snapshot.ref);

      const user = await prisma.user.update({
         where: { id: req.body.id },
         data: { avatar: url },
      });
      res.status(201).json({ user });
   } catch (error) {
      next(error);
   }
})

export default router;