/*
  Warnings:

  - You are about to drop the column `flexibility_level` on the `cessation_plan_template` table. All the data in the column will be lost.
  - You are about to drop the column `intensity_level` on the `cessation_plan_template` table. All the data in the column will be lost.
  - You are about to drop the column `physical_approach` on the `cessation_plan_template` table. All the data in the column will be lost.
  - You are about to drop the column `psychological_approach` on the `cessation_plan_template` table. All the data in the column will be lost.
  - You are about to drop the column `support_methods` on the `cessation_plan_template` table. All the data in the column will be lost.
  - You are about to drop the column `target_addiction_level` on the `cessation_plan_template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cessation_plan_template" DROP COLUMN "flexibility_level",
DROP COLUMN "intensity_level",
DROP COLUMN "physical_approach",
DROP COLUMN "psychological_approach",
DROP COLUMN "support_methods",
DROP COLUMN "target_addiction_level";

-- AlterTable
ALTER TABLE "quiz_response" ADD COLUMN     "order" INTEGER;
