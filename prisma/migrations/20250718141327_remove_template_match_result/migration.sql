/*
  Warnings:

  - You are about to drop the `template_matching_result` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "template_matching_result" DROP CONSTRAINT "template_matching_result_template_id_fkey";

-- DropForeignKey
ALTER TABLE "template_matching_result" DROP CONSTRAINT "template_matching_result_user_id_fkey";

-- DropTable
DROP TABLE "template_matching_result";
