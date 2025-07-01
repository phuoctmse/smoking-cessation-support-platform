import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common';
import { PlanStageService } from './plan-stage.service';
import { PlanStage } from './entities/plan-stage.entity';
import { CreatePlanStageInput } from './dto/request/create-plan-stage.input';
import { UpdatePlanStageInput } from './dto/request/update-plan-stage.input';
import { PlanStageFiltersInput } from './dto/request/plan-stage-filters.input';
import { PlanStageStatisticsResponse } from './dto/response/plan-stage-statistics.response';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { User } from '../../shared/decorators/current-user.decorator';
import { RoleName } from '../../shared/constants/role.constant';
import { UserType } from '../user/schema/user.schema';
import { PlanStageOrderInput } from './dto/request/plan-stage-order.input'

@Resolver(() => PlanStage)
export class PlanStageResolver {
  constructor(private readonly planStageService: PlanStageService) {}

  @Query(() => [PlanStage])
  @UseGuards(JwtAuthGuard)
  async planStagesByPlan(
    @Args('planId') planId: string,
    @User() user: UserType,
  ): Promise<PlanStage[]> {
    return this.planStageService.findByPlanId(planId, user.role, user.id);
  }

  @Query(() => PlanStage)
  @UseGuards(JwtAuthGuard)
  async planStage(
    @Args('id') id: string,
    @User() user: UserType,
  ): Promise<PlanStage> {
    return this.planStageService.findOne(id, user.role, user.id);
  }

  @Query(() => [PlanStage])
  @UseGuards(JwtAuthGuard)
  async activePlanStagesByPlan(
    @Args('planId') planId: string,
    @User() user: UserType,
  ): Promise<PlanStage[]> {
    return this.planStageService.findActiveByPlanId(planId, user.role, user.id);
  }

  @Query(() => PlanStageStatisticsResponse)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  async planStageStatistics(
    @Args('filters', { nullable: true }) filters?: PlanStageFiltersInput,
    @User() user?: UserType,
  ): Promise<PlanStageStatisticsResponse> {
    return this.planStageService.getStageStatistics(filters, user?.role, user?.id);
  }

  @Mutation(() => PlanStage)
  @UseGuards(JwtAuthGuard)
  async createPlanStage(
    @Args('input') input: CreatePlanStageInput,
    @User() user: UserType,
  ): Promise<PlanStage> {
    return this.planStageService.create(input, user.role, user.id);
  }

  @Mutation(() => PlanStage)
  @UseGuards(JwtAuthGuard)
  async updatePlanStage(
    @Args('input') input: UpdatePlanStageInput,
    @User() user: UserType,
  ): Promise<PlanStage> {
    const { id, ...updateData } = input;
    return this.planStageService.update(id, updateData, user.role, user.id);
  }

  @Mutation(() => [PlanStage])
  @UseGuards(JwtAuthGuard)
  async createStagesFromTemplate(
    @Args('planId') planId: string,
    @User() user: UserType,
  ): Promise<PlanStage[]> {
    return this.planStageService.createStagesFromTemplate(planId, user.role, user.id);
  }

  @Mutation(() => [PlanStage])
  @UseGuards(JwtAuthGuard)
  async reorderPlanStages(
    @Args('planId') planId: string,
    @Args('stageOrders', { type: () => [PlanStageOrderInput] }) stageOrders: PlanStageOrderInput[],
    @User() user: UserType,
  ): Promise<PlanStage[]> {
    return this.planStageService.reorderStages(
      planId,
      stageOrders.map(s => ({ id: s.id, order: s.order })),
      user.role,
      user.id,
    );
  }

  @Mutation(() => PlanStage)
  @UseGuards(JwtAuthGuard)
  async removePlanStage(
    @Args('id', { type: () => ID }) id: string,
    @User() user: UserType,
  ): Promise<PlanStage> {
    return this.planStageService.remove(id, user.role, user.id);
  }
}