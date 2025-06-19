import {Resolver, Query, Mutation, Args, ID} from '@nestjs/graphql';
import { BadgeTypeService } from './badge-type.service';
import { BadgeType } from './entities/badge-type.entity';
import { CreateBadgeTypeInput } from './dto/request/create-badge-type.input';
import { UpdateBadgeTypeInput } from './dto/request/update-badge-type.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'
import { RolesGuard } from 'src/shared/guards/roles.guard'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { RoleName } from 'src/shared/constants/role.constant';
import {User} from "../../shared/decorators/current-user.decorator";
import {UserType} from "../../shared/models/share-user.model";
import {PaginatedBadgeTypesResponse} from "./dto/response/paginated-badge-type.response";
import {PaginationParamsInput} from "../../shared/models/dto/request/pagination-params.input";
import {BadgeTypeFiltersInput} from "./dto/request/badge-type-filter.input";

@Resolver(() => BadgeType)
@UseGuards(JwtAuthGuard)
export class BadgeTypeResolver {
  constructor(private readonly badgeTypeService: BadgeTypeService) {}

  @Mutation(() => BadgeType)
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin)
  async createBadgeType(
    @Args('input') input: CreateBadgeTypeInput,
    @User() user: UserType,
  ): Promise<BadgeType> {
    return this.badgeTypeService.create(input, user);
  }

  @Query(() => BadgeType, { nullable: true })
  async badgeType(@Args('id', { type: () => ID }) id: string): Promise<BadgeType | null> {
    try {
      return await this.badgeTypeService.findOne(id);
    } catch (error) {
      return null;
    }
  }

  @Query(() => PaginatedBadgeTypesResponse)
  async badgeTypes(
    @Args('params', {
      nullable: true,
      type: () => PaginationParamsInput,
      defaultValue: { page: 1, limit: 10, orderBy: 'name', sortOrder: 'asc' },
    })
    params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => BadgeTypeFiltersInput })
    filters: BadgeTypeFiltersInput,
    @User() user: UserType,
  ): Promise<PaginatedBadgeTypesResponse> {
    return this.badgeTypeService.findAll(params, filters, user);
  }

  @Query(() => String, { description: 'Get badge type statistics for admin/coach' })
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin, RoleName.Coach)
  async badgeTypeStatistics(@User() user: UserType): Promise<string> {
    const stats = await this.badgeTypeService.getStatistics(user);
    return JSON.stringify(stats);
  }

  @Mutation(() => BadgeType)
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin)
  async updateBadgeType(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBadgeTypeInput,
    @User() user: UserType,
  ): Promise<BadgeType> {
    return this.badgeTypeService.update(id, input, user);
  }

  @Mutation(() => BadgeType)
  @UseGuards(RolesGuard)
  @Roles(RoleName.Admin)
  async removeBadgeType(
    @Args('id', { type: () => ID }) id: string,
    @User() user: UserType,
  ): Promise<BadgeType> {
    return this.badgeTypeService.remove(id, user);
  }
}