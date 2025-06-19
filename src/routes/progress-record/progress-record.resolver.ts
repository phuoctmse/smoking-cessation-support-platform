import {Resolver, Query, Mutation, Args, ID} from '@nestjs/graphql';
import { ProgressRecordService } from './progress-record.service';
import { ProgressRecord } from './entities/progress-record.entity';
import { CreateProgressRecordInput } from './dto/request/create-progress-record.input';
import { UpdateProgressRecordInput } from './dto/request/update-progress-record.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import {User} from "../../shared/decorators/current-user.decorator";
import {UserType} from "../../shared/models/share-user.model";
import { PaginatedProgressRecordsResponse } from './dto/response/paginated-progress-records.response'
import { PaginationParamsInput } from 'src/shared/models/dto/request/pagination-params.input'
import { ProgressRecordFiltersInput } from './dto/request/progress-record-filters.input';
import { RolesGuard } from '../../shared/guards/roles.guard'
import { RoleName } from '../../shared/constants/role.constant'
import { Roles } from '../../shared/decorators/roles.decorator'

@Resolver(() => ProgressRecord)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressRecordResolver {
  constructor(private readonly progressRecordService: ProgressRecordService) {}

  @Roles(RoleName.Member)
  @Mutation(() => ProgressRecord)
  async createProgressRecord(
    @Args('input') input: CreateProgressRecordInput,
    @User() user: UserType,
  ): Promise<ProgressRecord> {
    return this.progressRecordService.create(input, user);
  }

  @Query(() => PaginatedProgressRecordsResponse)
  async progressRecords(
    @Args('params', { nullable: true, type: () => PaginationParamsInput, defaultValue: { page: 1, limit: 10, orderBy: 'record_date', sortOrder: 'desc' } })
    params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => ProgressRecordFiltersInput })
    filters: ProgressRecordFiltersInput,
    @User() user: UserType,
  ) {
    return this.progressRecordService.findAll(params, filters, user);
  }

  @Roles(RoleName.Member)
  @Query(() => ProgressRecord, { nullable: true })
  async progressRecord(
    @Args('id', { type: () => ID }) id: string,
    @User() user: UserType,
  ): Promise<ProgressRecord | null> {
    return this.progressRecordService.findOne(id, user);
  }

  @Roles(RoleName.Member)
  @Mutation(() => ProgressRecord)
  async updateProgressRecord(
    @Args('input') input: UpdateProgressRecordInput,
    @User() user: UserType,
  ): Promise<ProgressRecord> {
    const { id, ...data } = input;
    return this.progressRecordService.update(id, data, user);
  }

  @Roles(RoleName.Member)
  @Mutation(() => ProgressRecord)
  async removeProgressRecord(
    @Args('id', { type: () => ID }) id: string,
    @User() user: UserType,
  ): Promise<ProgressRecord> {
    return this.progressRecordService.remove(id, user);
  }
}