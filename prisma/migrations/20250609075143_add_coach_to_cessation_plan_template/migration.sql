-- AlterTable
ALTER TABLE "cessation_plan_template" ADD COLUMN     "coach_id" TEXT;

-- AddForeignKey
ALTER TABLE "cessation_plan_template" ADD CONSTRAINT "cessation_plan_template_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
