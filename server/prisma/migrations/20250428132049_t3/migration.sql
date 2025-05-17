/*
  Warnings:

  - The values [DISCORD,GOOGLE] on the enum `oAuthProviders` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "oAuthProviders_new" AS ENUM ('discord', 'google');
ALTER TYPE "oAuthProviders" RENAME TO "oAuthProviders_old";
ALTER TYPE "oAuthProviders_new" RENAME TO "oAuthProviders";
DROP TYPE "oAuthProviders_old";
COMMIT;
