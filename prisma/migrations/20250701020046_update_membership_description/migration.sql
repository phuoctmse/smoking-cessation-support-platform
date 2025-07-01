/*
  Warnings:

  - The `description` column on the `membership_package` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "membership_package" DROP COLUMN "description",
ADD COLUMN     "description" TEXT[];
