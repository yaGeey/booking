-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "oAuthProviders",
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "salt" DROP NOT NULL;
