import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import type { User } from "../generated/prisma";
export type UserSession = Pick<User, "id" | "role">;

export function generateSalt() {
   return randomBytes(16).toString("hex").normalize();
}

export function hashPassword(password: string, salt: string): Promise<string> {
   return new Promise((resolve, reject) => {
      scrypt(password.normalize(), salt, 64, (err, derivedKey) => {
         if (err) reject(err);
         resolve(derivedKey.toString("hex").normalize());
      });
   });
}

export async function comparePassword(inputPassword: string, hashedPassword: string, salt: string): Promise<boolean> {
   // return (await hashPassword(req.body.password, user.salt)) === user.password; -- this is not safe and time depends on the order of the hash
   const inputHashedPassword = await hashPassword(inputPassword, salt);
   return timingSafeEqual(Buffer.from(inputHashedPassword.normalize(), "hex"), Buffer.from(hashedPassword.normalize(), "hex"));
}