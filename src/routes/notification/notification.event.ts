import { Injectable, Logger } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { NotificationTypeEnum } from 'src/shared/enums/graphql-enums'

@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async sendBadgeEarnedNotification(userId: string, badgeName: string, badgeDescription?: string) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: NotificationTypeEnum.BADGE_EARNED,
        channels: ['IN_APP'],
        title: 'Chúc mừng! Bạn đã nhận được huy hiệu mới!',
        content: `Bạn vừa được trao huy hiệu "${badgeName}". ${badgeDescription || 'Hãy tiếp tục nỗ lực!'}`,
        variables: {
          badge_name: badgeName,
          badge_description: badgeDescription || '',
        },
        metadata: {
          badge_name: badgeName,
          notification_type: 'badge_earned',
        },
      });

      this.logger.log(`Sent badge earned notification to user ${userId} for badge: ${badgeName}`);
    } catch (error) {
      this.logger.error(`Failed to send badge earned notification to user ${userId}:`, error);
    }
  }

  async sendStreakMilestoneNotification(userId: string, streakDays: number) {
    try {
      let milestoneMessage: string;
      if (streakDays === 1) {
        milestoneMessage = 'Chúc mừng ngày đầu tiên không hút thuốc!';
      } else if (streakDays === 7) {
        milestoneMessage = 'Tuyệt vời! Bạn đã hoàn thành tuần đầu tiên!';
      } else if (streakDays === 30) {
        milestoneMessage = 'Thật tuyệt vời! Một tháng không hút thuốc là thành tích đáng tự hào!';
      } else if (streakDays === 90) {
        milestoneMessage = 'Không thể tin được! 3 tháng không hút thuốc - bạn thật sự mạnh mẽ!';
      } else if (streakDays === 365) {
        milestoneMessage = 'Kỳ tích! Một năm hoàn toàn không hút thuốc!';
      } else {
        milestoneMessage = `${streakDays} ngày không hút thuốc - bạn đang làm rất tốt!`;
      }

      await this.notificationService.sendNotification({
        userId,
        type: NotificationTypeEnum.STREAK_MILESTONE,
        channels: ['IN_APP'],
        title: `Cột mốc ${streakDays} ngày không hút thuốc!`,
        content: milestoneMessage,
        variables: {
          streak_days: streakDays.toString(),
          milestone_message: milestoneMessage,
        },
        metadata: {
          streak_days: streakDays,
          notification_type: 'streak_milestone',
        },
      });

      this.logger.log(`Sent streak milestone notification to user ${userId} for ${streakDays} days`);
    } catch (error) {
      this.logger.error(`Failed to send streak milestone notification to user ${userId}:`, error);
    }
  }

  async sendStageCompletionNotification(userId: string, stageName: string, planName: string) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: NotificationTypeEnum.STAGE_COMPLETION,
        channels: ['IN_APP'],
        title: 'Chúc mừng! Giai đoạn hoàn thành!',
        content: `Bạn đã hoàn thành thành công giai đoạn "${stageName}" trong kế hoạch "${planName}". Hãy tiếp tục với giai đoạn tiếp theo!`,
        variables: {
          stage_name: stageName,
          plan_name: planName,
        },
        metadata: {
          stage_name: stageName,
          plan_name: planName,
          notification_type: 'stage_completion',
        },
      });

      this.logger.log(`Sent stage completion notification to user ${userId} for stage: ${stageName}`);
    } catch (error) {
      this.logger.error(`Failed to send stage completion notification to user ${userId}:`, error);
    }
  }

  async sendPlanCreatedNotification(userId: string, planName: string) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: NotificationTypeEnum.SYSTEM_ANNOUNCEMENT,
        channels: ['IN_APP'],
        title: 'Chúc mừng! Kế hoạch cai thuốc đã được tạo!',
        content: `Kế hoạch "${planName}" đã được tạo thành công. Hành trình cai thuốc của bạn bắt đầu từ hôm nay!`,
        variables: {
          plan_name: planName,
        },
        metadata: {
          plan_name: planName,
          notification_type: 'plan_created',
        },
      });

      this.logger.log(`Sent plan created notification to user ${userId} for plan: ${planName}`);
    } catch (error) {
      this.logger.error(`Failed to send plan created notification to user ${userId}:`, error);
    }
  }

  async sendPlanActivatedNotification(userId: string, planName: string) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: NotificationTypeEnum.SYSTEM_ANNOUNCEMENT,
        channels: ['IN_APP'],
        title: 'Kế hoạch đã được kích hoạt!',
        content: `Kế hoạch "${planName}" đã chính thức bắt đầu. Chúc bạn thành công trên hành trình cai thuốc!`,
        variables: {
          plan_name: planName,
        },
        metadata: {
          plan_name: planName,
          notification_type: 'plan_activated',
        },
      });

      this.logger.log(`Sent plan activated notification to user ${userId} for plan: ${planName}`);
    } catch (error) {
      this.logger.error(`Failed to send plan activated notification to user ${userId}:`, error);
    }
  }

  async sendPlanCompletedNotification(userId: string, planName: string, daysDuration: number) {
    try {
      await this.notificationService.sendNotification({
        userId,
        type: NotificationTypeEnum.SYSTEM_ANNOUNCEMENT,
        channels: ['IN_APP'],
        title: 'Chúc mừng! Bạn đã hoàn thành kế hoạch cai thuốc!',
        content: `Tuyệt vời! Bạn đã hoàn thành kế hoạch "${planName}" sau ${daysDuration} ngày kiên trì. Đây là một thành tựu đáng tự hào!`,
        variables: {
          plan_name: planName,
          days_duration: daysDuration.toString(),
        },
        metadata: {
          plan_name: planName,
          days_duration: daysDuration,
          notification_type: 'plan_completed',
        },
      });

      this.logger.log(`Sent plan completed notification to user ${userId} for plan: ${planName}`);
    } catch (error) {
      this.logger.error(`Failed to send plan completed notification to user ${userId}:`, error);
    }
  }
}