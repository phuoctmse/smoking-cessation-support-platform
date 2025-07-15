/*
  Warnings:

  - You are about to drop the column `bio` on the `coach_profile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'NUMBER', 'MULTIPLE_CHOICE', 'BOOLEAN', 'SCALE', 'DATE');

-- AlterTable
ALTER TABLE "cessation_plan_template" ADD COLUMN     "flexibility_level" TEXT,
ADD COLUMN     "intensity_level" TEXT,
ADD COLUMN     "physical_approach" TEXT[],
ADD COLUMN     "psychological_approach" TEXT[],
ADD COLUMN     "support_methods" TEXT[],
ADD COLUMN     "target_addiction_level" TEXT;

-- AlterTable
ALTER TABLE "coach_profile" DROP COLUMN "bio",
ADD COLUMN     "approach_description" TEXT,
ADD COLUMN     "average_rating" DOUBLE PRECISION,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "professional_bio" TEXT,
ADD COLUMN     "specializations" TEXT[],
ADD COLUMN     "success_rate" DOUBLE PRECISION,
ADD COLUMN     "total_clients" INTEGER,
ADD COLUMN     "total_sessions" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "member_profile" ADD COLUMN     "allergies" TEXT[],
ADD COLUMN     "brand_preference" TEXT,
ADD COLUMN     "daily_routine" JSONB,
ADD COLUMN     "health_conditions" TEXT[],
ADD COLUMN     "medications" TEXT[],
ADD COLUMN     "nicotine_level" DOUBLE PRECISION,
ADD COLUMN     "preferred_support" TEXT[],
ADD COLUMN     "previous_attempts" INTEGER,
ADD COLUMN     "quit_motivation" TEXT,
ADD COLUMN     "smoking_years" INTEGER,
ADD COLUMN     "social_support" BOOLEAN,
ADD COLUMN     "stress_level" INTEGER,
ADD COLUMN     "trigger_factors" TEXT[];

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

-- CreateTable
CREATE TABLE "profile_quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_question" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "description" TEXT,
    "question_type" "QuestionType" NOT NULL,
    "options" JSONB,
    "order" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "validation_rule" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_response" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempt" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "member_profile_id" TEXT NOT NULL,
    "status" "QuizStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_matching_result_user_id_template_id_key" ON "template_matching_result"("user_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_response_question_id_attempt_id_key" ON "quiz_response"("question_id", "attempt_id");

-- CreateIndex
CREATE INDEX "quiz_attempt_member_profile_id_idx" ON "quiz_attempt"("member_profile_id");

-- AddForeignKey
ALTER TABLE "template_matching_result" ADD CONSTRAINT "template_matching_result_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_matching_result" ADD CONSTRAINT "template_matching_result_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cessation_plan_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "profile_quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_response" ADD CONSTRAINT "quiz_response_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_response" ADD CONSTRAINT "quiz_response_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "profile_quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_member_profile_id_fkey" FOREIGN KEY ("member_profile_id") REFERENCES "member_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
