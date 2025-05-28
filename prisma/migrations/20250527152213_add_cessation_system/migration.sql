-- CreateEnum
CREATE TYPE "CessationPlanStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PlanStageStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "cessation_plan_template" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "estimated_duration_days" INTEGER NOT NULL,
    "average_rating" DOUBLE PRECISION DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cessation_plan_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_stage_template" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "description" TEXT,
    "recommended_actions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_stage_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cessation_plan" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "reason" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "target_date" TIMESTAMP(3) NOT NULL,
    "status" "CessationPlanStatus" NOT NULL DEFAULT 'PLANNING',
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cessation_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_stage" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "template_stage_id" TEXT,
    "stage_order" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "description" TEXT,
    "actions" TEXT,
    "status" "PlanStageStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_record" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "cigarettes_smoked" INTEGER NOT NULL DEFAULT 0,
    "health_score" INTEGER,
    "notes" TEXT,
    "record_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "template_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cessation_plan_template_name_key" ON "cessation_plan_template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stage_template_template_id_stage_order_key" ON "plan_stage_template"("template_id", "stage_order");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stage_plan_id_stage_order_key" ON "plan_stage"("plan_id", "stage_order");

-- CreateIndex
CREATE UNIQUE INDEX "progress_record_plan_id_record_date_key" ON "progress_record"("plan_id", "record_date");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_user_id_template_id_key" ON "feedback"("user_id", "template_id");

-- AddForeignKey
ALTER TABLE "plan_stage_template" ADD CONSTRAINT "plan_stage_template_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cessation_plan_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cessation_plan" ADD CONSTRAINT "cessation_plan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cessation_plan" ADD CONSTRAINT "cessation_plan_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cessation_plan_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_stage" ADD CONSTRAINT "plan_stage_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "cessation_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_stage" ADD CONSTRAINT "plan_stage_template_stage_id_fkey" FOREIGN KEY ("template_stage_id") REFERENCES "plan_stage_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_record" ADD CONSTRAINT "progress_record_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "cessation_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "cessation_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cessation_plan_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
