import { PrismaService } from '../../shared/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { Prisma } from '@prisma/client'
import { Notification } from './entities/notification.entity'

export interface NotificationFilters {
  notification_type?: string;
  channel?: string;
  status?: string;
  start_date?: Date;
  end_date?: Date;
}

export interface CreateNotificationInput {
  template_id?: string;
  user_id: string;
  title: string;
  content: string;
  notification_type: string;
  channel: string;
  scheduled_at?: Date;
  metadata?: any;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        template_id: data.template_id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        notification_type: data.notification_type as any,
        channel: data.channel as any,
        status: 'PENDING',
        scheduled_at: data.scheduled_at,
        metadata: data.metadata,
      },
      include: this.getDefaultIncludes(),
    });

    return this.transformToEntity(notification);
  }

  async findOne(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });

    return notification ? this.transformToEntity(notification) : null;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        read_at: new Date(),
        status: 'READ',
      },
      include: this.getDefaultIncludes(),
    });

    return this.transformToEntity(notification);
  }

  async updateStatus(id: string, status: string, sentAt?: Date): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        status: status as any,
        sent_at: sentAt,
      },
      include: this.getDefaultIncludes(),
    });

    return this.transformToEntity(notification);
  }

  async findMany(ids: string[]): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        id: { in: ids },
      },
      include: this.getDefaultIncludes(),
    });

    return notifications.map(n => this.transformToEntity(n));
  }

  async markMultipleAsRead(ids: string[]): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        read_at: new Date(),
        status: 'READ',
      },
    });

    return result.count;
  }

  async findByUserId(
    userId: string,
    params: PaginationParamsType,
    filters?: NotificationFilters
  ) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      user_id: userId,
    };

    if (filters) {
      if (filters.notification_type) {
        where.notification_type = filters.notification_type as any;
      }
      if (filters.channel) {
        where.channel = filters.channel as any;
      }
      if (filters.status) {
        where.status = filters.status as any;
      }
      if (filters.start_date && filters.end_date) {
        where.created_at = {
          gte: filters.start_date,
          lte: filters.end_date,
        };
      }
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: this.getDefaultIncludes(),
        orderBy: { [orderBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications.map(n => this.transformToEntity(n)),
      total,
      page,
      limit,
      hasNext: page < totalPages,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        user_id: userId,
        read_at: null,
      },
    });
  }

  async getNotificationStats(userId?: string) {
    const where: Prisma.NotificationWhereInput = userId ? { user_id: userId } : {};

    const [total, sent, pending, failed, read] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.notification.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.notification.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.notification.count({ where: { ...where, read_at: { not: null } } }),
    ]);

    return {
      total,
      sent,
      pending,
      failed,
      read,
      unread: total - read,
      delivery_rate: total > 0 ? (sent / total) * 100 : 0,
      read_rate: sent > 0 ? (read / sent) * 100 : 0,
    };
  }

  private getDefaultIncludes() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
          role: true,
          status: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
          title: true,
          notification_type: true,
          channel_types: true,
        },
      },
    };
  }

  private transformToEntity(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      template_id: dbNotification.template_id,
      user_id: dbNotification.user_id,
      title: dbNotification.title,
      content: dbNotification.content,
      notification_type: dbNotification.notification_type,
      channel: dbNotification.channel,
      status: dbNotification.status,
      scheduled_at: dbNotification.scheduled_at,
      sent_at: dbNotification.sent_at,
      read_at: dbNotification.read_at,
      metadata: dbNotification.metadata,
      created_at: dbNotification.created_at,
      updated_at: dbNotification.updated_at,
      user: dbNotification.user,
      template: dbNotification.template,
    };
  }
}