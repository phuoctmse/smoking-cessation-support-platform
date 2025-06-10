import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CessationPlanService } from './cessation-plan.service';
import { CessationPlan } from './entities/cessation-plan.entity';
import { CreateCessationPlanInput } from './dto/request/create-cessation-plan.input';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { User } from '../../shared/decorators/current-user.decorator';
import { UserType } from '../../shared/models/share-user.model';
import {PaginatedCessationPlansResponse} from "./dto/response/paginated-cessation-plans.response";
import {PaginationParamsInput} from "../../shared/models/dto/request/pagination-params.input";
import {CessationPlanFiltersInput} from "./dto/request/cessation-plan-filters.input";
import {CessationPlanStatisticsResponse} from "./dto/response/cessation-plan-statistics.response";
import {RolesGuard} from "../../shared/guards/roles.guard";
import {Roles} from "../../shared/decorators/roles.decorator";
import {RoleName} from "../../shared/constants/role.constant";
import {UpdateCessationPlanInput} from "./dto/request/update-cessation-plan.input";

@Resolver(() => CessationPlan)
export class CessationPlanResolver {
  constructor(private readonly cessationPlanService: CessationPlanService) {}

  @Mutation(() => CessationPlan)
  @UseGuards(JwtAuthGuard)
  @Roles(RoleName.Member)
  async createCessationPlan(
    @Args('input') input: CreateCessationPlanInput,
    @User() user: UserType,
  ): Promise<CessationPlan> {
    return this.cessationPlanService.create(input, user.id);
  }

  @Query(() => PaginatedCessationPlansResponse)
  @UseGuards(JwtAuthGuard)
  async cessationPlans(
      @Args('params', { nullable: true }) params?: PaginationParamsInput,
      @Args('filters', { nullable: true }) filters?: CessationPlanFiltersInput,
      @User() user?: UserType,
  ): Promise<PaginatedCessationPlansResponse> {
    return this.cessationPlanService.findAll(
        params || { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'desc' },
        filters,
        user?.role,
        user?.id,
    );
  }

  @Query(() => CessationPlan)
  @UseGuards(JwtAuthGuard)
  async cessationPlan(
      @Args('id') id: string,
      @User() user: UserType,
  ): Promise<CessationPlan> {
    return this.cessationPlanService.findOne(id, user.role, user.id);
  }

  @Query(() => [CessationPlan])
  @UseGuards(JwtAuthGuard)
  async userCessationPlans(
      @Args('userId', { nullable: true }) userId?: string,
      @User() user?: UserType,
  ): Promise<CessationPlan[]> {
    const targetUserId = userId || user?.id || '';
    return this.cessationPlanService.findByUserId(targetUserId, user?.id || '', user?.role || '');
  }

  @Query(() => [CessationPlan])
  @UseGuards(JwtAuthGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  async activeCessationPlans(
      @Args('userId', { nullable: true }) userId?: string,
      @User() user?: UserType,
  ): Promise<CessationPlan[]> {
    const targetUserId = userId || user?.id || '';
    return this.cessationPlanService.findActiveByUserId(targetUserId, user?.id || '', user?.role || '');
  }

  @Query(() => CessationPlanStatisticsResponse)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  async cessationPlanStatistics(
      @Args('filters', { nullable: true }) filters?: CessationPlanFiltersInput,
      @User() user?: UserType,
  ): Promise<CessationPlanStatisticsResponse> {
    return this.cessationPlanService.getStatistics(filters, user?.role, user?.id);
  }

  @Mutation(() => CessationPlan)
  @UseGuards(JwtAuthGuard)
  async updateCessationPlan(
      @Args('input') input: UpdateCessationPlanInput,
      @User() user: UserType,
  ): Promise<CessationPlan> {
    const { id, ...updateData } = input;
    return this.cessationPlanService.update(id, updateData, user.role, user.id);
  }
}