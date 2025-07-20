import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { Prisma } from '@prisma/client'
import { UpdateNotificationTemplateInput } from './dto/request/update-notification-template.input'
import { NotificationTemplateFiltersInput } from './dto/request/notification-template-filters.input'
import { CreateNotificationTemplateInput } from './dto/request/create-notification-template.input'
import { NotificationTemplate } from './entities/notification-template.entity'

@Injectable()
export class NotificationTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationTemplateInput): Promise<NotificationTemplate> {
    const template = await this.prisma.notificationTemplate.create({
      data: {
        name: data.name,
        title: data.title,
        content: data.content,
        notification_type: data.notification_type as any,
        channel_types: data.channel_types as any,
        variables: data.variables || [],
        is_active: true,
      },
    });

    return this.transformToEntity(template);
  }

  async findAll(params: PaginationParamsType, filters?: NotificationTemplateFiltersInput) {
    const { page, limit, orderBy, sortOrder, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationTemplateWhereInput = {};

    if (filters?.notification_type) {
      where.notification_type = filters.notification_type as any;
    }

    if (search || filters?.name) {
      const searchTerm = search || filters?.name;
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where: {is_active: true},
        orderBy: { [orderBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: templates.map(t => this.transformToEntity(t)),
      total,
      page,
      limit,
      hasNext: page < totalPages,
    };
  }

  async findOne(id: string): Promise<NotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: {
        id,
        is_active: true
      },
    });

    return template ? this.transformToEntity(template) : null;
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name },
    });

    return template ? this.transformToEntity(template) : null;
  }

  async update(id: string, data: UpdateNotificationTemplateInput): Promise<NotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.update({
      where: {
        id,
        is_active: true
      },
      data: {
        name: data.name,
        title: data.title,
        content: data.content,
        notification_type: data.notification_type as any,
        channel_types: data.channel_types as any,
        variables: data.variables,
      },
    });

    return this.transformToEntity(template);
  }

  async delete(id: string): Promise<NotificationTemplate | null> {
    const template = await this.prisma.notificationTemplate.update({
      where: { id },
      data: { is_active: false },
    });

    return this.transformToEntity(template);
  }

  async findByType(notificationType: string): Promise<NotificationTemplate[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: {
        notification_type: notificationType as any,
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return templates.map(t => this.transformToEntity(t));
  }

  private transformToEntity(dbTemplate: any): NotificationTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      title: dbTemplate.title,
      content: dbTemplate.content,
      notification_type: dbTemplate.notification_type,
      channel_types: dbTemplate.channel_types,
      variables: dbTemplate.variables,
      is_active: dbTemplate.is_active,
      created_at: dbTemplate.created_at,
      updated_at: dbTemplate.updated_at,
    };
  }
}