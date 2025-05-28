import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CessationPlanTemplateService } from './cessation-plan-template.service';
import { CessationPlanTemplate } from './entities/cessation-plan-template.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RoleName } from '../../shared/constants/role.constant';
import { User } from '../../shared/decorators/current-user.decorator';
import { UserType } from '../../shared/models/share-user.model';
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import {PaginatedCessationPlanTemplatesResponse} from "./dto/response/paginated-cessation-plan-templates.response";
import {CreateCessationPlanTemplateInput} from "./dto/request/create-cessation-plan-template.input";
import {UpdateCessationPlanTemplateInput} from "./dto/request/update-cessation-plan-template.input";

@Resolver(() => CessationPlanTemplate)
export class CessationPlanTemplateResolver {
  constructor(
      private readonly cessationPlanTemplateService: CessationPlanTemplateService,
  ) {}

  @Query(() => PaginatedCessationPlanTemplatesResponse)
  async cessationPlanTemplates(
      @Args('params', { nullable: true }) params?: PaginationParamsInput,
  ) {
    return this.cessationPlanTemplateService.findAll(
        params || {
          page: 1,
          limit: 10,
          orderBy: 'created_at',
          sortOrder: 'desc',
        },
    );
  }

  @Query(() => CessationPlanTemplate)
  async cessationPlanTemplate(@Args('id') id: string) {
    return this.cessationPlanTemplateService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  @Mutation(() => CessationPlanTemplate)
  async createCessationPlanTemplate(
      @Args('input') input: CreateCessationPlanTemplateInput,
      @User() user: UserType,
  ) {
    return this.cessationPlanTemplateService.create(input, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  @Mutation(() => CessationPlanTemplate)
  async updateCessationPlanTemplate(
      @Args('input') input: UpdateCessationPlanTemplateInput,
      @User() user: UserType,
  ) {
    const { id, ...updateData } = input;
    return this.cessationPlanTemplateService.update(id, updateData, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach)
  @Mutation(() => CessationPlanTemplate)
  async removeCessationPlanTemplate(
      @Args('id') id: string,
      @User() user: UserType,
  ) {
    return this.cessationPlanTemplateService.remove(id, user.role);
  }
}