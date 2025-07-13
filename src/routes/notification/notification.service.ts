import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { NotificationFilters, NotificationRepository } from './notification.repository'
import { RedisServices } from '../../shared/services/redis.service'
import { buildCacheKey, reviveDates } from '../../shared/utils/cache-key.util'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { NotificationTemplateRepository } from '../notification-template/notification-template.repository'
import { NotificationChannelEnum, NotificationTypeEnum } from '../../shared/enums/graphql-enums'
import { RoleName } from '../../shared/constants/role.constant'
import { Notification } from './entities/notification.entity'
import { PrismaService } from 'src/shared/services/prisma.service'

const CACHE_CONFIG = {
  TEMPLATE_TTL: 3600,
  NOTIFICATION_TTL: 1800,
}

export interface SendNotificationContext {
  userId: string
  type: NotificationTypeEnum
  templateName?: string
  title?: string
  content?: string
  channels?: string[]
  variables?: Record<string, any>
  metadata?: Record<string, any>
  scheduledAt?: Date
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly templateRepository: NotificationTemplateRepository,
    private readonly redisServices: RedisServices,
    private readonly prisma: PrismaService,
  ) {}

  async sendNotification(context: SendNotificationContext): Promise<Notification> {
    try {
      const template = await this.getTemplateIfSpecified(context.templateName)
      const user = await this.getUserData(context.userId)

      const variables = {
        user_name: user?.name || user?.user_name || 'Bạn',
        ...context.variables,
      }

      const { title, content } = this.prepareNotificationContent(context, template, variables)

      const channels = this.determineChannels(context, template)

      const notifications = await this.createNotificationsForChannels(
        context,
        template,
        channels,
        title,
        content,
        variables,
      )

      if (!context.scheduledAt) {
        for (const notification of notifications) {
          await this.deliverNotification(notification.id)
        }
      }

      return notifications[0]
    } catch (error) {
      this.logger.error('Error sending notification:', error)
      throw error
    }
  }

  private async createNotificationsForChannels(
    context: SendNotificationContext,
    template: any,
    channels: string[],
    title: string,
    content: string,
    variables: Record<string, any>,
  ): Promise<Notification[]> {
    const notifications: Notification[] = []

    for (const channel of channels) {
      const notificationData = {
        template_id: template?.id || null,
        user_id: context.userId,
        title,
        content,
        notification_type: context.type,
        channel,
        scheduled_at: context.scheduledAt || null,
        metadata: {
          ...context.metadata,
          variables,
          template_name: template?.name,
        },
      }

      const notification = await this.notificationRepository.create(notificationData)
      notifications.push(notification)
    }

    return notifications
  }

  async deliverNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne(notificationId)
    if (!notification) {
      const errorMessage = `Notification not found: ${notificationId}`
      this.logger.error(errorMessage)
      throw new NotFoundException(errorMessage)
    }

    try {
      await this.notificationRepository.updateStatus(notificationId, 'PROCESSING')

      let deliverySuccess: boolean

      const notifChannel = notification.channel as NotificationChannelEnum
      if (notifChannel && typeof notifChannel === 'string') {
        switch (notifChannel) {
          case NotificationChannelEnum.IN_APP:
            deliverySuccess = await this.deliverInAppNotification(notification)
            break
          case NotificationChannelEnum.EMAIL:
            deliverySuccess = await this.deliverEmailNotification(notification)
            break
          case NotificationChannelEnum.PUSH:
            deliverySuccess = await this.deliverPushNotification(notification)
            break
          default:
            this.logger.warn(`Unknown notification channel: ${notifChannel}`)
            deliverySuccess = false
        }
      } else {
        this.logger.warn(`Missing or invalid channel property in notification ${notificationId}`)
        deliverySuccess = false
      }

      const now = new Date()
      if (deliverySuccess) {
        await this.notificationRepository.updateStatus(notificationId, 'SENT', now)
        this.logger.log(`Notification ${notificationId} delivered successfully`)
      } else {
        await this.notificationRepository.updateStatus(notificationId, 'FAILED', now)
        this.logger.error(`Failed to deliver notification ${notificationId}`)
      }

      if (notification.user_id) {
        await this.invalidateUserNotificationCache(notification.user_id)
      }
    } catch (error) {
      this.logger.error(`Error delivering notification ${notificationId}:`, error)
      await this.notificationRepository.updateStatus(notificationId, 'FAILED')

      if (error instanceof NotFoundException) {
        throw error
      }
    }
  }

  private deliverInAppNotification(notification: Notification): Promise<boolean> {
    this.logger.log(`In-app notification sent to user ${notification.user_id}: ${notification.title}`)
    return Promise.resolve(true)
  }

  private deliverEmailNotification(notification: Notification): Promise<boolean> {
    this.logger.log(`Email notification sent to user ${notification.user_id}: ${notification.title}`)
    return Promise.resolve(true)
  }

  private deliverPushNotification(notification: Notification): Promise<boolean> {
    this.logger.log(`Push notification sent to user ${notification.user_id}: ${notification.title}`)
    return Promise.resolve(true)
  }

  private async getTemplateIfSpecified(templateName?: string) {
    if (!templateName) return null

    const template = await this.getTemplate(templateName)
    if (!template) {
      this.logger.warn(`Template not found: ${templateName}`)
    }
    return template
  }

  private async getTemplate(templateName: string) {
    const cacheKey = buildCacheKey('notification-template', 'byName', templateName)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        return JSON.parse(cached)
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for template ${templateName}:`, error)
    }

    const template = await this.templateRepository.findByName(templateName)
    if (template) {
      try {
        await this.redisServices.getClient().setEx(cacheKey, CACHE_CONFIG.TEMPLATE_TTL, JSON.stringify(template))
      } catch (error) {
        this.logger.warn(`Cache set failed for template ${templateName}:`, error)
      }
    }

    return template
  }

  private async getUserData(userId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          user_name: true,
          role: true,
          status: true,
          avatar_url: true,
        },
      })
    } catch (error) {
      this.logger.warn(`Failed to fetch user data for ${userId}:`, error)
      return null
    }
  }

  private prepareNotificationContent(context: SendNotificationContext, template: any, variables: Record<string, any>) {
    let title = context.title || template?.title || 'Thông báo'
    let content = context.content || template?.content || 'Bạn có thông báo mới'

    if (variables) {
      title = this.replaceVariables(title, variables)
      content = this.replaceVariables(content, variables)
    }

    return { title, content }
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{(\w+)}/g, (match, key) => {
      const value = variables[key]
      if (value === null || value === undefined) {
        return match
      }
      return typeof value === 'string' ? value : String(value)
    })
  }

  private determineChannels(context: SendNotificationContext, template: any): string[] {
    if (context.channels && context.channels.length > 0) {
      return context.channels
    }

    if (template?.channel_types && Array.isArray(template.channel_types) && template.channel_types.length > 0) {
      return template.channel_types
    }

    return ['IN_APP']
  }

  async markAsRead(notificationId: string, userId?: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne(notificationId)
    if (!notification) {
      throw new NotFoundException('Notification not found')
    }

    if (userId && notification.user_id !== userId) {
      throw new ForbiddenException('You can only mark your own notifications as read')
    }

    const updatedNotification = await this.notificationRepository.markAsRead(notificationId)
    await this.invalidateUserNotificationCache(updatedNotification.user_id)
    return updatedNotification
  }

  async markMultipleAsRead(notificationIds: string[], userId?: string): Promise<number> {
    if (userId) {
      const notifications = await this.notificationRepository.findMany(notificationIds)
      const unauthorizedNotifications = notifications.filter((n) => n.user_id !== userId)

      if (unauthorizedNotifications.length > 0) {
        throw new ForbiddenException('You can only mark your own notifications as read')
      }
    }

    const count = await this.notificationRepository.markMultipleAsRead(notificationIds)

    const notifications = await this.notificationRepository.findMany(notificationIds)
    const userIds = [...new Set(notifications.map((n) => n.user_id))]

    for (const userIdToInvalidate of userIds) {
      await this.invalidateUserNotificationCache(userIdToInvalidate)
    }

    return count
  }

  async getUserNotifications(
    userId: string,
    params: PaginationParamsType,
    filters?: NotificationFilters,
    requestingUserId?: string,
    requestingUserRole?: string,
  ) {
    if (requestingUserId && requestingUserId !== userId) {
      if (requestingUserRole !== RoleName.Admin && requestingUserRole !== RoleName.Coach) {
        throw new ForbiddenException('You can only view your own notifications')
      }
    }

    const cacheKey = buildCacheKey('user-notifications', userId, JSON.stringify({ params, filters }))

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (cached && typeof cached === 'string') {
        const result = JSON.parse(cached)
        if (result.data) {
          result.data.forEach((notification: any) => {
            reviveDates(notification, ['created_at', 'updated_at', 'scheduled_at', 'sent_at', 'read_at'])
          })
        }
        return result
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for user notifications ${userId}:`, error)
    }

    const result = await this.notificationRepository.findByUserId(userId, params, filters)

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_CONFIG.NOTIFICATION_TTL, JSON.stringify(result))
    } catch (error) {
      this.logger.warn(`Cache set failed for user notifications ${userId}:`, error)
    }

    return result
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = buildCacheKey('user-notifications', userId, 'unread-count')

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (cached && typeof cached === 'string') {
        return parseInt(cached, 10)
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for unread count ${userId}:`, error)
    }

    const count = await this.notificationRepository.getUnreadCount(userId)

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_CONFIG.NOTIFICATION_TTL, count.toString())
    } catch (error) {
      this.logger.warn(`Cache set failed for unread count ${userId}:`, error)
    }

    return count
  }

  private async invalidateUserNotificationCache(userId: string) {
    const pattern = buildCacheKey('user-notifications', userId, '*')
    try {
      const keys = await this.redisServices.getClient().keys(pattern)
      if (keys.length > 0) {
        await this.redisServices.getClient().del(keys)
      }
    } catch (error) {
      this.logger.warn(`Cache invalidation failed for user ${userId}:`, error)
    }
  }
}