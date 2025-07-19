import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/services/prisma.service';
import { NotificationService } from './notification.service';
import { CessationPlanStatus, PlanStageStatus } from '@prisma/client';
import { NotificationTypeEnum } from '../../shared/enums/graphql-enums';

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyPlanReminders() {
    try {
      const activePlans = await this.prisma.cessationPlan.findMany({
        where: {
          status: CessationPlanStatus.ACTIVE,
          is_deleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              user_name: true,
            },
          },
        },
      });

      if (activePlans.length === 0) {
        this.logger.log('No active plans found for daily reminders');
        return;
      }

      let sentCount = 0;
      for (const plan of activePlans) {
        const daysSinceStart = Math.floor(
          (new Date().getTime() - plan.start_date.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Skip if plan just started (avoid spam)
        if (daysSinceStart < 1) {
          continue;
        }

        try {
          await this.notificationService.sendNotification({
            userId: plan.user_id,
            type: NotificationTypeEnum.PLAN_REMINDER,
            channels: ['IN_APP'],
            title: 'Nhắc nhở kế hoạch cai thuốc',
            content: `Chào ${plan.user.name || plan.user.user_name}, hôm nay là ngày thứ ${daysSinceStart} trong hành trình cai thuốc của bạn! Hãy tiếp tục duy trì nhé!`,
            variables: {
              user_name: plan.user.name || plan.user.user_name,
              days_since_start: daysSinceStart.toString(),
              plan_reason: plan.reason || 'sức khỏe tốt hơn',
            },
            metadata: {
              plan_id: plan.id,
              days_since_start: daysSinceStart,
              reminder_type: 'daily_plan',
            },
          });
          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send daily reminder to user ${plan.user_id}:`, error);
        }
      }

      this.logger.log(`Sent ${sentCount} daily plan reminders`);
    } catch (error) {
      this.logger.error('Error in sendDailyPlanReminders:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendUpcomingStageNotifications() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      const upcomingStages = await this.prisma.planStage.findMany({
        where: {
          status: PlanStageStatus.PENDING,
          start_date: {
            gte: tomorrow,
            lt: nextDay,
          },
          is_deleted: false,
          plan: {
            status: CessationPlanStatus.ACTIVE,
            is_deleted: false,
          },
        },
        include: {
          plan: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  user_name: true,
                },
              },
            },
          },
        },
      });

      if (upcomingStages.length === 0) {
        this.logger.log('No upcoming stages found');
        return;
      }

      let sentCount = 0;
      for (const stage of upcomingStages) {
        try {
          await this.notificationService.sendNotification({
            userId: stage.plan.user_id,
            type: NotificationTypeEnum.STAGE_START,
            channels: ['IN_APP'],
            title: 'Giai đoạn mới sắp bắt đầu',
            content: `Giai đoạn "${stage.title}" sẽ bắt đầu vào ngày mai. Hãy chuẩn bị tinh thần để bước vào giai đoạn mới!`,
            variables: {
              user_name: stage.plan.user.name || stage.plan.user.user_name,
              stage_name: stage.title,
              start_date: stage.start_date?.toLocaleDateString('vi-VN') || 'ngày mai',
            },
            metadata: {
              stage_id: stage.id,
              plan_id: stage.plan_id,
              stage_order: stage.stage_order,
              notification_type: 'stage_upcoming',
            },
          });
          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send upcoming stage notification to user ${stage.plan.user_id}:`, error);
        }
      }

      this.logger.log(`Sent ${sentCount} upcoming stage notifications`);
    } catch (error) {
      this.logger.error('Error in sendUpcomingStageNotifications:', error);
    }
  }

  @Cron('0 9 * * 1') // Monday at 9:00 AM
  async sendWeeklyMotivationalMessages() {
    this.logger.log('Sending weekly motivational messages...');

    try {
      const activeUsers = await this.prisma.cessationPlan.findMany({
        where: {
          status: {
            in: [CessationPlanStatus.ACTIVE, CessationPlanStatus.PAUSED],
          },
          is_deleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              user_name: true,
            },
          },
        },
        distinct: ['user_id'],
      });

      if (activeUsers.length === 0) {
        this.logger.log('No active users found for weekly motivation');
        return;
      }

      const motivationalMessages = [
        'Bạn đang làm rất tốt! Hãy tiếp tục duy trì!',
        'Mỗi ngày không hút thuốc là một chiến thắng!',
        'Sức khỏe của bạn đang được cải thiện từng ngày!',
        'Hãy tự hào về những gì bạn đã đạt được!',
        'Gia đình và bạn bè đang ủng hộ bạn!',
        'Bạn đã vượt qua được những ngày khó khăn, hãy tiếp tục!',
        'Mỗi cơn thèm thuốc bạn chống lại được là một thắng lợi!',
      ];

      let sentCount = 0;
      for (const plan of activeUsers) {
        const weeksSinceStart = Math.floor(
          (new Date().getTime() - plan.start_date.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );

        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

        try {
          await this.notificationService.sendNotification({
            userId: plan.user_id,
            type: NotificationTypeEnum.COACH_MESSAGE,
            channels: ['IN_APP'],
            title: 'Thông điệp động viên tuần này',
            content: `${randomMessage} Bạn đã kiên trì được ${weeksSinceStart} tuần rồi đấy!`,
            variables: {
              user_name: plan.user.name || plan.user.user_name,
              weeks_count: weeksSinceStart.toString(),
              motivational_message: randomMessage,
            },
            metadata: {
              plan_id: plan.id,
              weeks_since_start: weeksSinceStart,
              message_type: 'weekly_motivation',
            },
          });
          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send weekly motivation to user ${plan.user_id}:`, error);
        }
      }

      this.logger.log(`Sent ${sentCount} weekly motivational messages`);
    } catch (error) {
      this.logger.error('Error in sendWeeklyMotivationalMessages:', error);
    }
  }

  @Cron('0 12 1 * *') // 1st day of month at 12:00 PM
  async sendHealthCheckReminders() {
    this.logger.log('Sending monthly health check reminders...');

    try {
      const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);

      const eligibleUsers = await this.prisma.cessationPlan.findMany({
        where: {
          status: CessationPlanStatus.ACTIVE,
          is_deleted: false,
          start_date: {
            lte: thirtyDaysAgo,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              user_name: true,
            },
          },
        },
        distinct: ['user_id'],
      });

      if (eligibleUsers.length === 0) {
        this.logger.log('No eligible users for health check reminders');
        return;
      }

      let sentCount = 0;
      for (const plan of eligibleUsers) {
        const daysSinceStart = Math.floor(
          (new Date().getTime() - plan.start_date.getTime()) / (1000 * 60 * 60 * 24)
        );

        try {
          await this.notificationService.sendNotification({
            userId: plan.user_id,
            type: NotificationTypeEnum.HEALTH_CHECK_REMINDER,
            channels: ['IN_APP'],
            title: 'Nhắc nhở kiểm tra sức khỏe',
            content: `Đã ${daysSinceStart} ngày kể từ khi bạn bắt đầu cai thuốc! Đây là lúc tốt để kiểm tra sức khỏe và thấy những cải thiện tích cực!`,
            variables: {
              user_name: plan.user.name || plan.user.user_name,
              days_since_start: daysSinceStart.toString(),
            },
            metadata: {
              plan_id: plan.id,
              days_since_start: daysSinceStart,
              reminder_type: 'health_check',
            },
          });
          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send health check reminder to user ${plan.user_id}:`, error);
        }
      }

      this.logger.log(`Sent ${sentCount} health check reminders`);
    } catch (error) {
      this.logger.error('Error in sendHealthCheckReminders:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processScheduledNotifications() {
    this.logger.log('Processing scheduled notifications...');

    try {
      const now = new Date();
      const scheduledNotifications = await this.prisma.notification.findMany({
        where: {
          status: 'PENDING',
          scheduled_at: {
            lte: now,
          },
        },
        take: 50,
        orderBy: {
          scheduled_at: 'asc',
        },
      });

      if (scheduledNotifications.length === 0) {
        return;
      }

      let processedCount = 0;
      let failedCount = 0;

      for (const notification of scheduledNotifications) {
        try {
          await this.notificationService.deliverNotification(notification.id);
          processedCount++;
        } catch (error) {
          failedCount++;
          this.logger.error(`Failed to deliver notification ${notification.id}:`, error);
        }
      }

      this.logger.log(`Processed ${processedCount} scheduled notifications (${failedCount} failed)`);
    } catch (error) {
      this.logger.error('Error in processScheduledNotifications:', error);
    }
  }
}