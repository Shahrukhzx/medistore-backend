/*
  Warnings:

  - Added the required column `phone` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SELLER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE';
