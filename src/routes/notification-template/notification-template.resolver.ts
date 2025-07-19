import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplate } from './entities/notification-template.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RoleName } from '../../shared/constants/role.constant';
import { UserType } from '../user/schema/user.schema';
import { PaginatedNotificationTemplatesResponse } from './dto/response/paginated-notification-templates.response';
import { PaginationParamsInput } from 'src/shared/models/dto/request/pagination-params.input';
import { NotificationTemplateFiltersInput } from "./dto/request/notification-template-filters.input";
import { CreateNotificationTemplateInput } from './dto/request/create-notification-template.input';
import { UpdateNotificationTemplateInput } from './dto/request/update-notification-template.input';

@Resolver(() => NotificationTemplate)
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationTemplateResolver {
  constructor(private readonly templateService: NotificationTemplateService) {}

  @Query(() => PaginatedNotificationTemplatesResponse)
  @Roles(RoleName.Admin)
  async notificationTemplates(
    @Args('params', { nullable: true }) params: PaginationParamsInput,
    @Args('filters', { nullable: true }) filters: NotificationTemplateFiltersInput,
    @CurrentUser() user: UserType,
  ): Promise<PaginatedNotificationTemplatesResponse> {
    const defaultParams = { page: 1, limit: 20, orderBy: 'created_at', sortOrder: 'desc' as const };
    return this.templateService.findAll({ ...defaultParams, ...params }, filters, user.role);
  }

  @Query(() => NotificationTemplate)
  @Roles(RoleName.Admin)
  async notificationTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<NotificationTemplate> {
    return this.templateService.findOne(id, user.role);
  }

  @Query(() => [NotificationTemplate])
  @Roles(RoleName.Admin)
  async notificationTemplatesByType(
    @Args('notificationType') notificationType: string,
    @CurrentUser() user: UserType,
  ): Promise<NotificationTemplate[]> {
    return this.templateService.findByType(notificationType, user.role);
  }

  @Mutation(() => NotificationTemplate)
  @Roles(RoleName.Admin)
  async createNotificationTemplate(
    @Args('data') data: CreateNotificationTemplateInput,
    @CurrentUser() user: UserType,
  ): Promise<NotificationTemplate> {
    return this.templateService.create(data, user.role);
  }

  @Mutation(() => NotificationTemplate)
  @Roles(RoleName.Admin)
  async updateNotificationTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdateNotificationTemplateInput,
    @CurrentUser() user: UserType,
  ): Promise<NotificationTemplate> {
    return this.templateService.update(id, data, user.role);
  }

  @Mutation(() => NotificationTemplate)
  @Roles(RoleName.Admin)
  async deleteNotificationTemplate(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<NotificationTemplate> {
    return this.templateService.remove(id, user.role);
  }
}