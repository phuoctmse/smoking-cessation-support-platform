import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { RedisServices } from '../../shared/services/redis.service';
import { buildCacheKey, buildOneCacheKey, invalidateCacheForId } from '../../shared/utils/cache-key.util'
import { NotificationTemplateRepository } from './notification-template.repository'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { CreateNotificationTemplateInput } from './dto/request/create-notification-template.input'
import { NotificationTemplateFiltersInput } from './dto/request/notification-template-filters.input'
import { UpdateNotificationTemplateInput } from './dto/request/update-notification-template.input';
import { RoleName } from '../../shared/constants/role.constant';
import { NotificationTypeEnum, NotificationChannelEnum } from 'src/shared/enums/graphql-enums';
import { NotificationTemplate } from './entities/notification-template.entity';
import { PaginatedNotificationTemplatesResponse } from './dto/response/paginated-notification-templates.response'

const CACHE_CONFIG = {
  TTL: 60 * 30,
  PREFIX: 'notification-template',
  STATS_TTL: 60 * 60,
} as const;

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    private readonly templateRepository: NotificationTemplateRepository,
    private readonly redisServices: RedisServices,
  ) {}

  async create(data: CreateNotificationTemplateInput, userRole: string): Promise<NotificationTemplate> {
    this.validateAdminPermission(userRole);
    await this.validateUniqueName(data.name);
    this.validateVariables(data.variables);
    this.validateChannelTypes(data.channel_types);

    try {
      const dbTemplate = await this.templateRepository.create(data);
      await this.invalidateTemplateListCaches();
      this.logger.log(`Notification template created: ${dbTemplate.id}`);
      return this.transformToGraphQLEntity(dbTemplate);
    } catch (error) {
      this.logger.error(`Failed to create notification template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create notification template');
    }
  }

  async findAll(
    params: PaginationParamsType,
    filters: NotificationTemplateFiltersInput = {},
    userRole: string
  ): Promise<PaginatedNotificationTemplatesResponse> {
    this.validateViewPermission(userRole);

    const cacheKey = buildCacheKey(CACHE_CONFIG.PREFIX, 'list', params, filters);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return this.transformPaginatedResponse(cached);

    const result = await this.templateRepository.findAll(params, filters);

    const paginatedResult = this.transformPaginatedResponse(result);

    await this.setCachedData(cacheKey, result, CACHE_CONFIG.TTL);
    return paginatedResult;
  }

  async findOne(id: string, userRole: string): Promise<NotificationTemplate> {
    this.validateViewPermission(userRole);

    const cacheKey = buildOneCacheKey(CACHE_CONFIG.PREFIX, id);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return this.transformToGraphQLEntity(cached);

    const template = await this.templateRepository.findOne(id);
    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    await this.setCachedData(cacheKey, template, CACHE_CONFIG.TTL);
    return this.transformToGraphQLEntity(template);
  }

  async update(id: string, data: UpdateNotificationTemplateInput, userRole: string): Promise<NotificationTemplate> {
    this.validateAdminPermission(userRole);
    await this.validateTemplateExists(id);

    if (data.name) {
      await this.validateUniqueName(data.name, id);
    }

    if (data.variables) {
      this.validateVariables(data.variables);
    }

    if (data.channel_types) {
      this.validateChannelTypes(data.channel_types);
    }

    try {
      const updatedTemplate = await this.templateRepository.update(id, data);
      await this.invalidateTemplateCaches(id);
      this.logger.log(`Notification template updated: ${id}`);
      return this.transformToGraphQLEntity(updatedTemplate);
    } catch (error) {
      this.logger.error(`Failed to update notification template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update notification template');
    }
  }

  async remove(id: string, userRole: string): Promise<NotificationTemplate> {
    this.validateAdminPermission(userRole);
    await this.validateTemplateExists(id);

    try {
      const removedTemplate = await this.templateRepository.delete(id);
      await this.invalidateTemplateCaches(id);
      this.logger.log(`Notification template removed: ${id}`);
      return this.transformToGraphQLEntity(removedTemplate);
    } catch (error) {
      this.logger.error(`Failed to remove notification template: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove notification template');
    }
  }

  async findByType(notificationType: string, userRole: string): Promise<NotificationTemplate[]> {
    this.validateViewPermission(userRole);

    const cacheKey = buildCacheKey(CACHE_CONFIG.PREFIX, 'byType', notificationType);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached.map((template: any) => this.transformToGraphQLEntity(template));

    const templates = await this.templateRepository.findByType(notificationType);
    await this.setCachedData(cacheKey, templates, CACHE_CONFIG.TTL);
    return templates.map(template => this.transformToGraphQLEntity(template));
  }

  async findByName(templateName: string) {
    const cacheKey = buildCacheKey(CACHE_CONFIG.PREFIX, 'byName', templateName);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const template = await this.templateRepository.findByName(templateName);
    if (template) {
      await this.setCachedData(cacheKey, template, CACHE_CONFIG.TTL);
    }
    return template;
  }

  private validateAdminPermission(userRole: string): void {
    if (userRole !== RoleName.Admin) {
      throw new ForbiddenException('Only administrators can manage notification templates');
    }
  }

  private validateViewPermission(userRole: string): void {
    if (![RoleName.Admin, RoleName.Coach].includes(userRole as any)) {
      throw new ForbiddenException('Only administrators and coaches can view notification templates');
    }
  }

  private async validateUniqueName(name: string, excludeId?: string): Promise<void> {
    const existingTemplate = await this.templateRepository.findByName(name);
    if (existingTemplate && existingTemplate.id !== excludeId) {
      throw new BadRequestException('Template name already exists');
    }
  }

  private async validateTemplateExists(id: string): Promise<void> {
    const template = await this.templateRepository.findOne(id);
    if (!template) {
      throw new NotFoundException('Notification template not found');
    }
  }

  private validateVariables(variables?: string[]): void {
    if (!variables) return;

    const validVariablePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    const invalidVariables = variables.filter(v => !validVariablePattern.test(v));

    if (invalidVariables.length > 0) {
      throw new BadRequestException(`Invalid variable names: ${invalidVariables.join(', ')}`);
    }
  }

  private validateChannelTypes(channelTypes: string[]): void {
    const validChannels = Object.values(NotificationChannelEnum);
    const invalidChannels = channelTypes.filter(
      c => !validChannels.includes(c as NotificationChannelEnum)
    );

    if (invalidChannels.length > 0) {
      throw new BadRequestException(`Invalid channel types: ${invalidChannels.join(', ')}`);
    }
  }

  private transformToGraphQLEntity(dbTemplate: any): NotificationTemplate {
    if (!dbTemplate) return null;

    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      title: dbTemplate.title,
      content: dbTemplate.content,
      notification_type: this.mapNotificationTypeToGraphQL(dbTemplate.notification_type),
      channel_types: dbTemplate.channel_types.map((channel: string) =>
        this.mapChannelTypeToGraphQL(channel)
      ),
      variables: dbTemplate.variables || [],
      is_active: dbTemplate.is_active,
      created_at: dbTemplate.created_at,
      updated_at: dbTemplate.updated_at,
    };
  }

  private transformPaginatedResponse(result: any): PaginatedNotificationTemplatesResponse {
    const totalPages = result.totalPages || Math.ceil(result.total / result.limit);

    return {
      data: result.data.map((template: any) => this.transformToGraphQLEntity(template)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext: result.hasNext ?? (result.page < totalPages),
    };
  }

  private mapNotificationTypeToGraphQL(dbType: string): NotificationTypeEnum {
    switch (dbType) {
      case 'PLAN_REMINDER':
        return NotificationTypeEnum.PLAN_REMINDER;
      case 'STAGE_START':
        return NotificationTypeEnum.STAGE_START;
      case 'STAGE_COMPLETION':
        return NotificationTypeEnum.STAGE_COMPLETION;
      case 'BADGE_EARNED':
        return NotificationTypeEnum.BADGE_EARNED;
      case 'STREAK_MILESTONE':
        return NotificationTypeEnum.STREAK_MILESTONE;
      case 'COACH_MESSAGE':
        return NotificationTypeEnum.COACH_MESSAGE;
      case 'SYSTEM_ANNOUNCEMENT':
        return NotificationTypeEnum.SYSTEM_ANNOUNCEMENT;
      case 'HEALTH_CHECK_REMINDER':
        return NotificationTypeEnum.HEALTH_CHECK_REMINDER;
      default:
        return NotificationTypeEnum.SYSTEM_ANNOUNCEMENT;
    }
  }

  private mapChannelTypeToGraphQL(dbChannel: string): NotificationChannelEnum {
    switch (dbChannel) {
      case 'IN_APP':
        return NotificationChannelEnum.IN_APP;
      case 'EMAIL':
        return NotificationChannelEnum.EMAIL;
      case 'PUSH':
        return NotificationChannelEnum.PUSH;
      default:
        return NotificationChannelEnum.IN_APP;
    }
  }

  private async getCachedData(key: string): Promise<any> {
    try {
      const cached = await this.redisServices.getClient().get(key);
      if (typeof cached === 'string') {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      this.logger.warn(`Cache get failed for key ${key}:`, error);
      return null;
    }
  }

  private async setCachedData(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redisServices.getClient().setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${key}:`, error);
    }
  }

  private async invalidateTemplateCaches(templateId: string): Promise<void> {
    try {
      const cacheKeys = [
        buildOneCacheKey(CACHE_CONFIG.PREFIX, templateId),
      ];

      const invalidationPromises = [
        await this.redisServices.getClient().del(cacheKeys),
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_CONFIG.PREFIX, 'list'),
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_CONFIG.PREFIX, 'byType'),
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_CONFIG.PREFIX, 'byName'),
      ];

      await Promise.all(invalidationPromises);
      this.logger.log(`Invalidated template caches for: ${templateId}`);
    } catch (error) {
      this.logger.error('Error invalidating template caches:', error);
    }
  }

  private async invalidateTemplateListCaches(): Promise<void> {
    try {
      const invalidationPromises = [
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_CONFIG.PREFIX, 'list'),
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_CONFIG.PREFIX, 'byType'),
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_CONFIG.PREFIX, 'byName'),
      ];

      await Promise.all(invalidationPromises);
      this.logger.log('Invalidated notification template list caches');
    } catch (error) {
      this.logger.error('Error invalidating template list caches:', error);
    }
  }
}