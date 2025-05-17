/*
  Warnings:

  - Made the column `avatarColor` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatarColor" SET NOT NULL;
