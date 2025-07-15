import { registerEnumType } from '@nestjs/graphql'
import { CessationPlanStatus, PlanStageStatus } from '@prisma/client'

export enum NotificationTypeEnum {
  PLAN_REMINDER = 'PLAN_REMINDER',
  STAGE_START = 'STAGE_START',
  STAGE_COMPLETION = 'STAGE_COMPLETION',
  BADGE_EARNED = 'BADGE_EARNED',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  COACH_MESSAGE = 'COACH_MESSAGE',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  HEALTH_CHECK_REMINDER = 'HEALTH_CHECK_REMINDER',
}

export enum NotificationChannelEnum {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum NotificationStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
  description: 'Types of notifications in the smoking cessation platform',
  valuesMap: {
    PLAN_REMINDER: {
      description: 'Reminder for cessation plan activities',
    },
    STAGE_START: {
      description: 'Notification when a new stage begins',
    },
    STAGE_COMPLETION: {
      description: 'Notification when a stage is completed',
    },
    BADGE_EARNED: {
      description: 'Notification when a badge is earned',
    },
    STREAK_MILESTONE: {
      description: 'Notification for streak milestones',
    },
    COACH_MESSAGE: {
      description: 'Message from coach',
    },
    SYSTEM_ANNOUNCEMENT: {
      description: 'System-wide announcements',
    },
    HEALTH_CHECK_REMINDER: {
      description: 'Health check reminder',
    },
  },
});

registerEnumType(NotificationChannelEnum, {
  name: 'NotificationChannelEnum',
  description: 'Notification delivery channels',
  valuesMap: {
    IN_APP: {
      description: 'In-app notification',
    },
    EMAIL: {
      description: 'Email notification',
    },
    PUSH: {
      description: 'Push notification',
    },
  },
});

registerEnumType(NotificationStatusEnum, {
  name: 'NotificationStatusEnum',
  description: 'Notification status',
  valuesMap: {
    PENDING: {
      description: 'Notification pending',
    },
    PROCESSING: {
      description: 'Notification being processed',
    },
    SENT: {
      description: 'Notification sent',
    },
    READ: {
      description: 'Notification read',
    },
    FAILED: {
      description: 'Notification failed to send',
    },
    CANCELLED: {
      description: 'Notification cancelled',
    },
  },
});

registerEnumType(CessationPlanStatus, {
  name: 'CessationPlanStatus',
  description: 'The status of a cessation plan',
  valuesMap: {
    PLANNING: {
      description: 'Plan is being created',
    },
    ACTIVE: {
      description: 'Plan is currently active',
    },
    PAUSED: {
      description: 'Plan is temporarily paused',
    },
    COMPLETED: {
      description: 'Plan has been completed',
    },
    CANCELLED: {
      description: 'Plan has been cancelled',
    },
  },
})

registerEnumType(PlanStageStatus, {
  name: 'PlanStageStatus',
  description: 'The status of a plan stage',
  valuesMap: {
    PENDING: {
      description: 'Stage is pending',
    },
    ACTIVE: {
      description: 'Stage is currently active',
    },
    COMPLETED: {
      description: 'Stage has been completed',
    },
    SKIPPED: {
      description: 'Stage has been skipped',
    },
  },
})

export enum RoleNameEnum {
  MEMBER = 'MEMBER',
  COACH = 'COACH',
  ADMIN = 'ADMIN',
}

export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

registerEnumType(RoleNameEnum, {
  name: 'RoleNameEnum',
  description: 'The role of the user',
})

registerEnumType(StatusEnum, {
  name: 'StatusEnum',
  description: 'The status of the user',
})