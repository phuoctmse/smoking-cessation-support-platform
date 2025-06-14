/*
  Warnings:

  - You are about to drop the column `payment_id` on the `payment_transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sepay_id]` on the table `payment_transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sepay_id` to the `payment_transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payment_transaction" DROP CONSTRAINT "payment_transaction_payment_id_fkey";

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "payment_transaction_id" TEXT;

-- AlterTable
ALTER TABLE "payment_transaction" DROP COLUMN "payment_id",
ADD COLUMN     "sepay_id" TEXT NOT NULL,
ALTER COLUMN "amountIn" DROP NOT NULL,
ALTER COLUMN "amountOut" DROP NOT NULL,
ALTER COLUMN "accumulated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subscription" ALTER COLUMN "start_date" DROP NOT NULL,
ALTER COLUMN "end_date" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'INACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_sepay_id_key" ON "payment_transaction"("sepay_id");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "payment_transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
