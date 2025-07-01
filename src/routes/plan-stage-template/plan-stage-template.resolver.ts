import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { PlanStageTemplate } from './entities/plan-stage-template.entity'
import { PlanStageTemplateService } from './plan-stage-template.service'
import { PaginatedPlanStageTemplatesResponse } from './dto/responses/paginated-plan-stage-templates.response'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { RoleName } from '../../shared/constants/role.constant'
import { Roles } from '../../shared/decorators/roles.decorator'
import { User } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { CreatePlanStageTemplateInput } from './dto/requests/create-plan-stage-template.input'
import { UpdatePlanStageTemplateInput } from './dto/requests/update-plan-stage-template.input'
import {StageOrderInput} from "./dto/requests/stage-order.input";

@Resolver(() => PlanStageTemplate)
export class PlanStageTemplateResolver {
  constructor(private readonly planStageTemplateService: PlanStageTemplateService) {}

  @Query(() => PaginatedPlanStageTemplatesResponse)
  async planStageTemplates(
      @Args('templateId') templateId: string,
      @Args('params', { nullable: true }) params?: PaginationParamsInput,
  ) {
    return this.planStageTemplateService.findAll(
        params || { page: 1, limit: 10, orderBy: 'stage_order', sortOrder: 'asc' },
        templateId,
    );
  }

  @Query(() => PlanStageTemplate)
  async planStageTemplate(@Args('id') id: string) {
    return this.planStageTemplateService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => PlanStageTemplate)
  async createPlanStageTemplate(
      @Args('input') input: CreatePlanStageTemplateInput,
      @User() user: UserType,
  ) {
    return this.planStageTemplateService.create(input, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => PlanStageTemplate)
  async updatePlanStageTemplate(
      @Args('input') input: UpdatePlanStageTemplateInput,
      @User() user: UserType,
  ) {
    const { id, ...updateData } = input;
    return this.planStageTemplateService.update(id, updateData, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => PlanStageTemplate)
  async removePlanStageTemplate(@Args('id') id: string, @User() user: UserType) {
    return this.planStageTemplateService.remove(id, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => [PlanStageTemplate])
  async reorderPlanStageTemplates(
      @Args('templateId') templateId: string,
      @Args('stageOrders', { type: () => [StageOrderInput] }) stageOrders: StageOrderInput[],
      @User() user: UserType,
  ) {
    return this.planStageTemplateService.reorderStages(
        templateId,
        stageOrders.map(s => ({ id: s.id, order: s.order })),
        user.role,
    );
  }
}