/*
  Warnings:

  - You are about to drop the column `badge_type` on the `badge` table. All the data in the column will be lost.
  - Added the required column `badge_type_id` to the `badge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "badge" DROP COLUMN "badge_type",
ADD COLUMN     "badge_type_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "BadgeType";

-- CreateTable
CREATE TABLE "badge_type" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badge_type_name_key" ON "badge_type"("name");

-- AddForeignKey
ALTER TABLE "badge" ADD CONSTRAINT "badge_badge_type_id_fkey" FOREIGN KEY ("badge_type_id") REFERENCES "badge_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
