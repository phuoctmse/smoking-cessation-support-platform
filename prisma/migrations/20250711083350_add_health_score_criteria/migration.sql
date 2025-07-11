-- CreateTable
CREATE TABLE "health_score_criteria" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_score_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_score_criteria_coach_id_idx" ON "health_score_criteria"("coach_id");

-- CreateIndex
CREATE INDEX "health_score_criteria_is_active_idx" ON "health_score_criteria"("is_active");

-- CreateIndex
CREATE INDEX "health_score_criteria_created_at_idx" ON "health_score_criteria"("created_at");

-- AddForeignKey
ALTER TABLE "health_score_criteria" ADD CONSTRAINT "health_score_criteria_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
