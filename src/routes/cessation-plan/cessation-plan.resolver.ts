import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SubscriptionGuard } from '../../shared/guards/subscription.guard';
import { CessationPlanService } from './cessation-plan.service';
import { CreateCessationPlanInput } from './dto/request/create-cessation-plan.input';
import { UpdateCessationPlanInput } from './dto/request/update-cessation-plan.input';
import { CessationPlan } from './entities/cessation-plan.entity';
import { CustomAIRecommendationService } from '../../shared/services/custom-ai-recommendation.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { PaginatedCessationPlansResponse } from './dto/response/paginated-cessation-plans.response';
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input';
import { CessationPlanFiltersInput } from './dto/request/cessation-plan-filters.input';
import { CessationPlanStatisticsResponse } from './dto/response/cessation-plan-statistics.response';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RoleName } from '../../shared/constants/role.constant';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { UserType } from '../user/schema/user.schema';
import { AIRecommendationOutput } from './schema/ai-recommendation.schema';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Resolver(() => CessationPlan)
@UseGuards(JwtAuthGuard)
export class CessationPlanResolver {
  constructor(
    private readonly cessationPlanService: CessationPlanService,
    private readonly aiRecommendationService: CustomAIRecommendationService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => AIRecommendationOutput)
  async getAIRecommendation(@CurrentUser() user: UserType): Promise<AIRecommendationOutput> {
    // Get user's member profile
    const memberProfile = await this.prisma.memberProfile.findFirst({
      where: {
        user: {
          id: user.id
        }
      }
    });

    if (!memberProfile) {
      throw new Error('Member profile not found');
    }

    // Get AI recommendation
    const recommendation = await this.aiRecommendationService.getRecommendation(memberProfile);
    
    // Map the output to match the schema
    return {
      recommendedTemplate: recommendation.recommendedTemplate.id,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      alternativeTemplates: recommendation.alternativeTemplates.map(t => t.id)
    };
  }

  @Mutation(() => CessationPlan)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Member)
  async createCessationPlan(
    @Args('input') input: CreateCessationPlanInput,
    @CurrentUser() user: UserType,
  ): Promise<CessationPlan> {
    return this.cessationPlanService.create(input, user.id);
  }

  @Query(() => PaginatedCessationPlansResponse)
  @UseGuards(JwtAuthGuard)
  async cessationPlans(
      @Args('params', { nullable: true }) params?: PaginationParamsInput,
      @Args('filters', { nullable: true }) filters?: CessationPlanFiltersInput,
      @CurrentUser() user?: UserType,
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
      @CurrentUser() user: UserType,
  ): Promise<CessationPlan> {
    return this.cessationPlanService.findOne(id, user.role, user.id);
  }

  @Query(() => [CessationPlan])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Member)
  async userCessationPlans(@CurrentUser() user?: UserType): Promise<CessationPlan[]> {
    return this.cessationPlanService.findByUserId(user);
  }

  @Query(() => CessationPlanStatisticsResponse)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Coach, RoleName.Admin)
  async cessationPlanStatistics(
      @Args('filters', { nullable: true }) filters?: CessationPlanFiltersInput,
      @CurrentUser() user?: UserType,
  ): Promise<CessationPlanStatisticsResponse> {
    return this.cessationPlanService.getStatistics(filters, user?.role, user?.id);
  }

  @Mutation(() => CessationPlan)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.Member)
  async updateCessationPlan(
      @Args('input') input: UpdateCessationPlanInput,
      @CurrentUser() user: UserType,
  ): Promise<CessationPlan> {
    const { id, ...updateData } = input;
    return this.cessationPlanService.update(id, updateData, user.role, user.id);
  }
}