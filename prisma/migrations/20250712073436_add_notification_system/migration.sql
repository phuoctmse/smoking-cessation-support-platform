-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PLAN_REMINDER', 'STAGE_START', 'STAGE_COMPLETION', 'BADGE_EARNED', 'STREAK_MILESTONE', 'COACH_MESSAGE', 'SYSTEM_ANNOUNCEMENT', 'HEALTH_CHECK_REMINDER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "notification_template" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "channel_types" "NotificationChannel"[],
    "variables" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "template_id" TEXT,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_name_key" ON "notification_template"("name");

-- CreateIndex
CREATE INDEX "notification_template_notification_type_idx" ON "notification_template"("notification_type");

-- CreateIndex
CREATE INDEX "notification_template_is_active_idx" ON "notification_template"("is_active");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- CreateIndex
CREATE INDEX "notification_status_idx" ON "notification"("status");

-- CreateIndex
CREATE INDEX "notification_scheduled_at_idx" ON "notification"("scheduled_at");

-- CreateIndex
CREATE INDEX "notification_notification_type_idx" ON "notification"("notification_type");

-- CreateIndex
CREATE INDEX "notification_channel_idx" ON "notification"("channel");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
