import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { CessationPlanTemplateService } from './cessation-plan-template.service'
import { CessationPlanTemplate } from './entities/cessation-plan-template.entity'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { RoleName } from '../../shared/constants/role.constant'
import { User } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { PaginatedCessationPlanTemplatesResponse } from './dto/response/paginated-cessation-plan-templates.response'
import { CreateCessationPlanTemplateInput } from './dto/request/create-cessation-plan-template.input'
import { UpdateCessationPlanTemplateInput } from './dto/request/update-cessation-plan-template.input'
import { CessationPlanTemplateFiltersInput } from './dto/request/cessation-plan-template-filters.input'

@Resolver(() => CessationPlanTemplate)
export class CessationPlanTemplateResolver {

  constructor(private readonly cessationPlanTemplateService: CessationPlanTemplateService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => CessationPlanTemplate)
  async createCessationPlanTemplate(@Args('input') input: CreateCessationPlanTemplateInput, @User() user: UserType) {
    return this.cessationPlanTemplateService.create(input, user)
  }

  @Query(() => PaginatedCessationPlanTemplatesResponse)
  async cessationPlanTemplates(
    @Args('params', { nullable: true }) params?: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => CessationPlanTemplateFiltersInput }) filters?: CessationPlanTemplateFiltersInput,
  ) {
    return this.cessationPlanTemplateService.findAll(
      params || {
        page: 1,
        limit: 10,
        orderBy: 'created_at',
        sortOrder: 'desc',
      },
      filters,
    )
  }

  @Query(() => CessationPlanTemplate)
  async cessationPlanTemplate(@Args('id') id: string) {
    return this.cessationPlanTemplateService.findOne(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => CessationPlanTemplate)
  async updateCessationPlanTemplate(@Args('input') input: UpdateCessationPlanTemplateInput) {
    const { id, ...updateData } = input
    return this.cessationPlanTemplateService.update(id, updateData)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => CessationPlanTemplate)
  async removeCessationPlanTemplate(@Args('id') id: string, @User() user: UserType) {
    return this.cessationPlanTemplateService.remove(id, user.role)
  }
}