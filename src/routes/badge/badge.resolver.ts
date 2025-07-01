import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql'
import { BadgeService } from './badge.service';
import { Badge } from './entities/badge.entity';
import { CreateBadgeInput } from './dto/request/create-badge.input';
import { UpdateBadgeInput } from './dto/request/update-badge.input'
import { UseGuards } from '@nestjs/common'
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserType } from '../user/schema/user.schema'
import { User } from '../../shared/decorators/current-user.decorator'
import { RoleName } from '../../shared/constants/role.constant'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { PaginatedBadgesResponse } from './dto/response/paginated-badge.response'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { BadgeFiltersInput } from './dto/request/badge-filter.input'

@Resolver(() => Badge)
@UseGuards(JwtAuthGuard)
export class BadgeResolver {
  constructor(private readonly badgeService: BadgeService) {}

  @Mutation(() => Badge)
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async createBadge(
    @Args('input') input: CreateBadgeInput,
    @User() user: UserType,
  ): Promise<Badge> {
    return this.badgeService.create(input, user);
  }

  @Query(() => Badge, { nullable: true })
  async badge(@Args('id', { type: () => ID }) id: string): Promise<Badge | null> {
    try {
      return await this.badgeService.findOne(id);
    } catch (error) {
      return null;
    }
  }

  @Query(() => PaginatedBadgesResponse)
  async badges(
    @Args('params', {
      nullable: true,
      type: () => PaginationParamsInput,
      defaultValue: { page: 1, limit: 10, orderBy: 'sort_order', sortOrder: 'asc' },
    })
    params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => BadgeFiltersInput })
    filters: BadgeFiltersInput,
    @User() user: UserType,
  ): Promise<PaginatedBadgesResponse> {
    return this.badgeService.findAll(params, filters, user);
  }

  @Query(() => String, { description: 'Get badge statistics for admin/coach' })
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async badgeStatistics(@User() user: UserType): Promise<string> {
    const stats = await this.badgeService.getStatistics(user);
    return JSON.stringify(stats);
  }

  @Mutation(() => Badge)
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async updateBadge(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBadgeInput,
    @User() user: UserType,
  ): Promise<Badge> {
    return this.badgeService.update(id, input, user);
  }

  @Mutation(() => Badge)
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async removeBadge(
    @Args('id', { type: () => ID }) id: string,
    @User() user: UserType,
  ): Promise<Badge> {
    return this.badgeService.remove(id, user);
  }
}