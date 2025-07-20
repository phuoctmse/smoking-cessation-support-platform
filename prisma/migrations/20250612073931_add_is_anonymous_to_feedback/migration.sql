/*
  Warnings:

  - You are about to drop the column `plan_id` on the `feedback` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_plan_id_fkey";

-- AlterTable
ALTER TABLE "feedback" DROP COLUMN "plan_id",
ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false;
