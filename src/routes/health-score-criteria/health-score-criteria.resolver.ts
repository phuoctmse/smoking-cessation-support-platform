import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql'
import { HealthScoreCriteriaService } from './health-score-criteria.service';
import { HealthScoreCriteria } from './entities/health-score-criteria.entity'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard'
import { RolesGuard } from 'src/shared/guards/roles.guard'
import { Roles } from 'src/shared/decorators/roles.decorator'
import { RoleName } from 'src/shared/constants/role.constant'
import { CreateHealthScoreCriteriaInput } from './dto/request/create-health-score-criteria.input'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema';
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { UpdateHealthScoreCriteriaInput } from './dto/request/update-health-score-criteria.input';
import { HealthScoreCriteriaFiltersInput } from './dto/request/health-score-criteria-filters.input'
import { PaginatedHealthScoreCriteria } from './dto/response/paginated-health-score-criteria.response'

@Resolver(() => HealthScoreCriteria)
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthScoreCriteriaResolver {
  constructor(private readonly service: HealthScoreCriteriaService) {}

  @Mutation(() => HealthScoreCriteria)
  @Roles(RoleName.Coach, RoleName.Admin)
  async createHealthScoreCriteria(
    @Args('input') input: CreateHealthScoreCriteriaInput,
    @CurrentUser() user: UserType,
  ): Promise<HealthScoreCriteria> {
    return this.service.create(input, user.id, user.role);
  }

  @Query(() => PaginatedHealthScoreCriteria)
  async healthScoreCriteriaList(
    @Args('params', { nullable: true }) params: PaginationParamsInput,
    @Args('filters', { nullable: true }) filters: HealthScoreCriteriaFiltersInput,
    @CurrentUser() user: UserType,
  ): Promise<PaginatedHealthScoreCriteria> {
    const defaultParams = { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'desc' as const };
    return this.service.findAll({ ...defaultParams, ...params }, filters, user.role, user.id);
  }

  @Query(() => HealthScoreCriteria)
  async healthScoreCriteria(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<HealthScoreCriteria> {
    return this.service.findOne(id, user.role, user.id);
  }

  @Query(() => [HealthScoreCriteria])
  async healthScoreCriteriaByCoach(
    @Args('coachId', { type: () => ID }) coachId: string,
    @CurrentUser() user: UserType,
  ): Promise<HealthScoreCriteria[]> {
    return this.service.findByCoachId(coachId, user.id, user.role);
  }

  @Mutation(() => HealthScoreCriteria)
  @Roles(RoleName.Coach, RoleName.Admin)
  async updateHealthScoreCriteria(
    @Args('input') input: UpdateHealthScoreCriteriaInput,
    @CurrentUser() user: UserType,
  ): Promise<HealthScoreCriteria> {
    const { id, ...data } = input;
    return this.service.update(id, data, user.role, user.id);
  }

  @Mutation(() => HealthScoreCriteria)
  @Roles(RoleName.Coach, RoleName.Admin)
  async removeHealthScoreCriteria(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserType,
  ): Promise<HealthScoreCriteria> {
    return this.service.remove(id, user.role, user.id);
  }
}