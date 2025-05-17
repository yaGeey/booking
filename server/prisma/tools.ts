import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function recoverFromNotFound<A>(promise: Promise<A>): Promise<A | null> {
   try {
      return await promise;
   } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
         if (e.code === "P2025") {
            return null;
         }
      }
      throw e;
   }
}
