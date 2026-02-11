/*
  Warnings:

  - Added the required column `sellerId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "sellerId" TEXT NOT NULL;
