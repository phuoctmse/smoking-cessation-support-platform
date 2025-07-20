import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql'
import { NotificationService } from './notification.service'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { PaginatedNotificationsResponse } from './dto/response/paginated-notifications.response'
import { Notification } from './entities/notification.entity'
import { UserType } from '../user/schema/user.schema'
import { PaginationParamsInput } from 'src/shared/models/dto/request/pagination-params.input'
import { NotificationFiltersInput } from './dto/request/notification-filters.input'

@Resolver(() => Notification)
@UseGuards(JwtAuthGuard)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => PaginatedNotificationsResponse)
  async userNotifications(
    @Args('params') params: PaginationParamsInput,
    @Args('filters', { nullable: true }) filters?: NotificationFiltersInput,
    @CurrentUser() user?: UserType,
  ): Promise<PaginatedNotificationsResponse> {
    return this.notificationService.getUserNotifications(
      user.id,
      params,
      filters,
      user.id,
      user.role
    );
  }

  @Query(() => Number)
  async unreadNotificationCount(
    @CurrentUser() user: UserType,
  ): Promise<number> {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Mutation(() => Notification)
  async markNotificationAsRead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Mutation(() => Number)
  async markMultipleNotificationsAsRead(
    @Args('ids', { type: () => [ID] }) ids: string[],
    @CurrentUser() user: UserType,
  ): Promise<number> {
    return this.notificationService.markMultipleAsRead(ids, user.id);
  }
}