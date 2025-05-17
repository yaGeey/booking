/*
  Warnings:

  - Made the column `title` on table `Room` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isViewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "title" SET NOT NULL;

-- CreateTable
CREATE TABLE "_MessageViewed" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MessageViewed_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MessageViewed_B_index" ON "_MessageViewed"("B");

-- AddForeignKey
ALTER TABLE "_MessageViewed" ADD CONSTRAINT "_MessageViewed_A_fkey" FOREIGN KEY ("A") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageViewed" ADD CONSTRAINT "_MessageViewed_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
