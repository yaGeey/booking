import { Router } from "express";
import getOAuthProviders from "../../lib/oauth/providers";
import type { oAuthProviders } from "../../generated/prisma";
import { PrismaClient } from "../../generated/prisma/index.js";
import { createUserSession } from "../../redis/sessions";
import { ErrorResponse } from "../../lib/errors";
import getRandomColor from "../../utils/getRandomColor";
const prisma = new PrismaClient();
const router = Router();

router.get("/:provider", (req, res) => {
   const provider = req.params.provider as oAuthProviders;
   const url = getOAuthProviders(res.cookie.bind(res), provider).createAuthUrl();
   res.redirect(url);
});

router.get("/callback/:provider", async (req, res) => {
   const provider = req.params.provider as oAuthProviders;
   const { code, state } = req.query;
   const { state: cookieState, code_verifier } = req.cookies;
   if (typeof code !== "string" || typeof state !== "string" || typeof cookieState !== "string" || typeof code_verifier !== "string")
      throw new ErrorResponse();

   if (cookieState !== state) throw new ErrorResponse("Invalid state", 400);

   const client = getOAuthProviders(res.cookie.bind(res), provider);
   const tokens = await client.fetchToken(code, code_verifier);
   const userData = await client.fetchUserData(tokens.access_token);
   const { id, email, name, avatar } = userData;

   let user = await prisma.user.findUnique({ where: { email } }); // TODO test logging in with same email but different provider
   if (!user) {
      user = await prisma.user.create({
         data: {
            name,
            email,
            provider,
            providerId: id,
            avatar,
            avatarColor: getRandomColor(),
         },
      });
   }

   await createUserSession({ id: user.id, role: user.role, cookie: res.cookie.bind(res) });
   res.redirect("http://localhost:3000");
});

export default router;
