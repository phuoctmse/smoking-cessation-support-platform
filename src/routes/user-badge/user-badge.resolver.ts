import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql'
import { UserBadgeService } from './user-badge.service';
import { UserBadge } from './entities/user-badge.entity';
import { RoleName } from 'src/shared/constants/role.constant'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { PaginatedUserBadgesResponse } from './dto/response/paginated-user-badge.response'
import { PaginationParamsInput } from 'src/shared/models/dto/request/pagination-params.input';
import { UserBadgeFiltersInput } from './dto/request/user-badge-filter.input'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'

@Resolver(() => UserBadge)
@UseGuards(JwtAuthGuard)
export class UserBadgeResolver {
  constructor(private readonly userBadgeService: UserBadgeService) {}

  @Query(() => PaginatedUserBadgesResponse, { description: 'Get my badges' })
  async myBadges(
    @Args('params', {
      nullable: true,
      type: () => PaginationParamsInput,
      defaultValue: { page: 1, limit: 10, orderBy: 'awarded_at', sortOrder: 'desc' },
    })
    params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => UserBadgeFiltersInput })
    filters: UserBadgeFiltersInput,
    @CurrentUser() user: UserType,
  ): Promise<PaginatedUserBadgesResponse> {
    return this.userBadgeService.getMyBadges(params, filters, user);
  }

  @Query(() => PaginatedUserBadgesResponse, { description: 'Get badges of a specific user' })
  async userBadges(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('params', {
      nullable: true,
      type: () => PaginationParamsInput,
      defaultValue: { page: 1, limit: 10, orderBy: 'awarded_at', sortOrder: 'desc' },
    })
    params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => UserBadgeFiltersInput })
    filters: UserBadgeFiltersInput,
    @CurrentUser() user: UserType,
  ): Promise<PaginatedUserBadgesResponse> {
    return this.userBadgeService.getUserBadges(userId, params, filters, user);
  }

  @Query(() => PaginatedUserBadgesResponse, { description: 'Get all user badges (Admin/Coach only)' })
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async allUserBadges(
    @Args('params', {
      nullable: true,
      type: () => PaginationParamsInput,
      defaultValue: { page: 1, limit: 10, orderBy: 'awarded_at', sortOrder: 'desc' },
    })
    params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => UserBadgeFiltersInput })
    filters: UserBadgeFiltersInput,
    @CurrentUser() user: UserType,
  ): Promise<PaginatedUserBadgesResponse> {
    return this.userBadgeService.getAllUserBadges(params, filters, user);
  }

  @Query(() => UserBadge, { nullable: true })
  async userBadge(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<UserBadge | null> {
    try {
      return await this.userBadgeService.findOne(id, user);
    } catch (error) {
      return null;
    }
  }

  @Query(() => String, { description: 'Get my badge statistics' })
  async myBadgeStats(@CurrentUser() user: UserType): Promise<string> {
    const stats = await this.userBadgeService.getMyBadgeStats(user);
    return JSON.stringify(stats);
  }

  @Query(() => String, { description: 'Get badge statistics for a specific user' })
  async userBadgeStats(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() user: UserType,
  ): Promise<string> {
    const stats = await this.userBadgeService.getUserBadgeStats(userId, user);
    return JSON.stringify(stats);
  }

  @Mutation(() => UserBadge, { description: 'Award a badge to a user (Admin/Coach only)' })
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async awardBadge(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('badgeId', { type: () => ID }) badgeId: string,
    @CurrentUser() user: UserType,
  ): Promise<UserBadge> {
    return this.userBadgeService.awardBadge(userId, badgeId, user);
  }
}