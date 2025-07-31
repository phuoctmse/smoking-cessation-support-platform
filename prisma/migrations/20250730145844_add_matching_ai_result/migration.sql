-- CreateTable
CREATE TABLE "template_matching_result" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "matching_score" DOUBLE PRECISION NOT NULL,
    "matching_factors" JSONB NOT NULL,
    "recommendation_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_matching_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_matching_result_user_id_template_id_key" ON "template_matching_result"("user_id", "template_id");

-- AddForeignKey
ALTER TABLE "template_matching_result" ADD CONSTRAINT "template_matching_result_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_matching_result" ADD CONSTRAINT "template_matching_result_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cessation_plan_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
