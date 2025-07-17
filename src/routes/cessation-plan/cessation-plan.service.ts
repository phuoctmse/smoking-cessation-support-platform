import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CessationPlanStatus } from '@prisma/client'
import { CessationPlanFilters, CessationPlanRepository } from './cessation-plan.repository'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { RoleName } from '../../shared/constants/role.constant'
import { CreateCessationPlanType } from './schema/create-cessation-plan.schema'
import { UpdateCessationPlanType } from './schema/update-cessation-plan.schema'
import { PlanStageRepository } from '../plan-stage/plan-stage.repository'
import { UserType } from '../user/schema/user.schema'
import { BadgeAwardService } from '../badge-award/badge-award.service'
import { CessationPlanTemplateRepository } from '../cessation-plan-template/cessation-plan-template.repository'
import { RedisServices } from '../../shared/services/redis.service'
import {
  buildCacheKey,
  buildOneCacheKey,
  buildTrackerKey,
  invalidateCacheForId,
  reviveDates,
  trackCacheKey,
} from '../../shared/utils/cache-key.util'
import { NotificationEventService } from '../notification/notification.event'
import { UserService } from '../user/user.service'

const CACHE_TTL = 60 * 5;
const CACHE_PREFIX = 'cessation-plan';

@Injectable()
export class CessationPlanService {
  private readonly logger = new Logger(CessationPlanService.name)

  constructor(
    private readonly cessationPlanRepository: CessationPlanRepository,
    private readonly cessationPlanTemplateRepository: CessationPlanTemplateRepository,
    @Inject(forwardRef(() => PlanStageRepository))
    private readonly planStageRepository: PlanStageRepository,
    private readonly badgeAwardService: BadgeAwardService,
    private readonly redisServices: RedisServices,
    private readonly notificationEventService: NotificationEventService,
    private readonly userService: UserService,
  ) {}

  async create(data: CreateCessationPlanType, requestUserId: string) {
    await this.validateCreateRules(data, requestUserId)

    const planData = {
      ...data,
      user_id: requestUserId,
      status: CessationPlanStatus.PLANNING,
    }

    const plan = await this.cessationPlanRepository.create(planData)
    await this.badgeAwardService.processPlanCreation(plan.user_id, plan.id);

    if (plan.template_id) {
      try {
        await this.planStageRepository.createStagesFromTemplate(plan.id, plan.template_id, plan.start_date);
        // Cập nhật thống kê coach khi có client mới
        await this.userService.onNewClientStarted(plan.template_id);
        await this.invalidateTemplateUsageStatsCache(plan.template_id)
      } catch (stageError) {
        this.logger.error(
          `Failed to create stages from template for plan ${plan.id}: ${stageError.message}. Plan created without stages.`,
        )
      }
    }

    const fullPlan = await this.cessationPlanRepository.findOne(plan.id)
    if (!fullPlan) {
      this.logger.error(`Failed to retrieve newly created plan ${plan.id}`)
      throw new NotFoundException('Failed to retrieve newly created plan.')
    }

    const planDisplayName = this.getPlanDisplayName(fullPlan);
    await this.notificationEventService.sendPlanCreatedNotification(
      requestUserId,
      planDisplayName
    );

    await this.invalidateUserRelatedCaches(requestUserId);
    await this.invalidateListCaches();

    return this.enrichWithComputedFields(fullPlan)
  }

  async findAll(params: PaginationParamsType, filters?: CessationPlanFilters, userRole?: string, userId?: string) {
    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId)

    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, effectiveFilters, userRole, userId);

    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.data)) {
        parsed.data.forEach((plan: any) => {
          reviveDates(plan, ['start_date', 'target_date', 'created_at', 'updated_at']);
          if (plan.stages && Array.isArray(plan.stages)) {
            plan.stages.forEach((stage: any) => {
              reviveDates(stage, ['start_date', 'end_date', 'created_at', 'updated_at']);
            });
          }
        });
        parsed.data = parsed.data.map((plan: any) => this.enrichWithComputedFields(plan));
      }
      return parsed;
    }

    const result = await this.cessationPlanRepository.findAll(params, effectiveFilters)
    const enrichedResult = {
      ...result,
      data: result.data.map((plan) => this.enrichWithComputedFields(plan)),
    };

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(enrichedResult), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, 'all-lists');
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);

    return enrichedResult;
  }

  async findOne(id: string, userRole: string, userId: string) {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      reviveDates(parsed, ['start_date', 'target_date', 'created_at', 'updated_at']);
      if (parsed.stages && Array.isArray(parsed.stages)) {
        parsed.stages.forEach((stage: any) => {
          reviveDates(stage, ['start_date', 'end_date', 'created_at', 'updated_at']);
        });
      }

      this.validateAccessPermission(parsed, userId, userRole);
      return this.enrichWithComputedFields(parsed);
    }

    const plan = await this.cessationPlanRepository.findOne(id)
    if (!plan) {
      throw new NotFoundException('Cessation plan not found')
    }

    this.validateAccessPermission(plan, userId, userRole)

    const enriched = this.enrichWithComputedFields(plan);

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(plan), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, plan.user_id);
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);

    return enriched;
  }

  async findByUserId(user: UserType) {
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'byUser', user.id);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((plan: any) => {
          reviveDates(plan, ['start_date', 'target_date', 'created_at', 'updated_at']);
          if (plan.stages && Array.isArray(plan.stages)) {
            plan.stages.forEach((stage: any) => {
              reviveDates(stage, ['start_date', 'end_date', 'created_at', 'updated_at']);
            });
          }
        });
      }
      return parsed.map((plan: any) => this.enrichWithComputedFields(plan));
    }

    const plans = await this.cessationPlanRepository.findByUserId(user.id)
    const enrichedPlans = plans.map(
      (plan) => this.enrichWithComputedFields(plan)
    );

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(plans), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, user.id);
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);

    return enrichedPlans;
  }

  async getStatistics(filters?: CessationPlanFilters, userRole?: string, userId?: string) {
    if (userRole === RoleName.Member) {
      throw new ForbiddenException('Only coaches and admins can access statistics')
    }

    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId)

    const cacheKey = buildCacheKey(CACHE_PREFIX, 'stats', effectiveFilters, userRole, userId);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      return JSON.parse(cached);
    }

    const stats = await this.cessationPlanRepository.getStatistics(effectiveFilters);

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(stats), { EX: 60 * 2 });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, 'stats-cache');
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);

    return stats;
  }

  async update(id: string, data: Omit<UpdateCessationPlanType, 'id'>, userRole: string, userId: string) {
    const existingPlan = await this.cessationPlanRepository.findOne(id)

    if (!existingPlan) {
      throw new NotFoundException('Cessation plan not found')
    }

    this.validateUpdatePermission(existingPlan, userId, userRole)

    if (data.status && data.status !== existingPlan.status) {
      this.validateStatusTransition(existingPlan.status, data.status)
    }

    this.validateUpdateRules(data, existingPlan)

    const updatedPlan = await this.cessationPlanRepository.update(id, data)
    this.logger.log(`Cessation plan updated: ${updatedPlan.id}`)

    if (data.status && data.status !== existingPlan.status) {
      const planDisplayName = this.getPlanDisplayName(updatedPlan);

      if (data.status === CessationPlanStatus.ACTIVE && existingPlan.status === CessationPlanStatus.PLANNING) {
        await this.notificationEventService.sendPlanActivatedNotification(
            updatedPlan.user_id,
            planDisplayName
        );
      } else if (data.status === CessationPlanStatus.COMPLETED) {
        const daysDuration = Math.floor(
            (new Date().getTime() - updatedPlan.start_date.getTime()) / (1000 * 60 * 60 * 24)
        );
        await this.notificationEventService.sendPlanCompletedNotification(
            updatedPlan.user_id,
            planDisplayName,
            daysDuration
        );
      }
    }

    if (
        updatedPlan.template_id && (
            updatedPlan.status === CessationPlanStatus.COMPLETED ||
            updatedPlan.status === CessationPlanStatus.ABANDONED
        )
    ) {
      await this.updateTemplateSuccessRate(updatedPlan.template_id);
      // Cập nhật thống kê coach khi plan hoàn thành hoặc bị hủy
      await this.userService.onPlanCompleted(updatedPlan.template_id);
    }

    if (updatedPlan.template_id) {
      await this.invalidateTemplateUsageStatsCache(updatedPlan.template_id)
    }

    await this.invalidatePlanCaches(id, updatedPlan.user_id);
    await this.invalidateListCaches();
    await this.invalidateStatsCaches();

    return this.enrichWithComputedFields(updatedPlan)
  }

  private async updateTemplateSuccessRate(templateId: string): Promise<void> {
    const stats = await this.cessationPlanRepository.countByStatusForTemplate(templateId);

    const completedCount = stats.find(
      s => s.status === CessationPlanStatus.COMPLETED
    )?._count.id || 0;
    const abandonedCount = stats.find(
      s => s.status === CessationPlanStatus.ABANDONED
    )?._count.id || 0;

    const totalFinished = completedCount + abandonedCount;
    const successRate = totalFinished > 0 ? (completedCount / totalFinished) * 100 : 0;

    await this.cessationPlanTemplateRepository.update(templateId, {
      success_rate: parseFloat(successRate.toFixed(2)),
    });
    await this.invalidateTemplateCaches(templateId);
  }

  private applyRoleBasedFilters(
    filters?: CessationPlanFilters,
    userRole?: string,
    userId?: string,
  ): CessationPlanFilters {
    const effectiveFilters = { ...filters }

    if (userRole === RoleName.Member && userId) {
      effectiveFilters.user_id = userId
    }

    return effectiveFilters
  }

  private getPlanDisplayName(plan: any): string {
    if (plan.template && plan.template.name) {
      return plan.template.name;
    }

    if (plan.reason) {
      return `Kế hoạch: ${plan.reason}`;
    }

    return 'Kế hoạch cai thuốc';
  }

  private enrichWithComputedFields(plan: any) {
    const now = new Date()
    const startDate = new Date(plan.start_date)
    const targetDate = new Date(plan.target_date)

    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysToTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let completionPercentage = 0;
    if (plan.stages && Array.isArray(plan.stages)) {
      const totalStages = plan.stages.length;
      const completedStages = plan.stages.filter(
        (stage: any) => stage.status === 'COMPLETED'
      ).length;

      if (totalStages > 0) {
        completionPercentage = (completedStages / totalStages) * 100;
      }
    }

    return {
      ...plan,
      completion_percentage: parseFloat(completionPercentage.toFixed(2)),
      days_since_start: Math.max(0, daysSinceStart),
      days_to_target: Math.max(0, daysToTarget),
      is_overdue: now > targetDate && !['COMPLETED', 'CANCELLED'].includes(plan.status),
    }
  }

  private validateAccessPermission(plan: any, userId: string, userRole: string): void {
    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only access your own cessation plans')
    }
  }

  private validateUpdatePermission(plan: any, userId: string, userRole: string): void {
    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only update your own cessation plans')
    }
  }

  private async invalidateTemplateUsageStatsCache(templateId: string): Promise<void> {
    const patterns = [
      `${CACHE_PREFIX}:usage-stats:${templateId}:*`,
      `cessation-plan-template:usage-stats:${templateId}:*`,
    ]

    for (const pattern of patterns) {
      try {
        const keys = await this.redisServices.getClient().keys(pattern)
        if (keys.length > 0) {
          await this.redisServices.getClient().del(keys)
        }
      } catch (error) {
        this.logger.warn(`Failed to clear template usage stats cache: ${error.message}`)
      }
    }
  }

  private validateStatusTransition(currentStatus: CessationPlanStatus, newStatus: CessationPlanStatus): void {
    const validTransitions: Record<CessationPlanStatus, CessationPlanStatus[]> = {
      PLANNING: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED', 'ABANDONED'],
      PAUSED: ['ACTIVE', 'CANCELLED', 'ABANDONED'],
      COMPLETED: [],
      ABANDONED: ['CANCELLED'],
      CANCELLED: ['PLANNING'],
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }
  }

  private async validateCreateRules(data: CreateCessationPlanType, userId: string): Promise<void> {
    const activeStatuses = ['PLANNING', 'ACTIVE', 'PAUSED']
    const existingActivePlans = await this.cessationPlanRepository.findByUserId(userId)

    const activePlans = existingActivePlans.filter(plan =>
      activeStatuses.includes(plan.status)
    )

    if (activePlans.length > 0) {
      throw new ConflictException('You already have an active cessation plan. Please complete or cancel it before creating a new one.')
    }

    if (data.target_date <= data.start_date) {
      throw new BadRequestException('Target date must be after start date')
    }

    const now = new Date()
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000
    if (data.start_date.getTime() < now.getTime() - oneDayInMilliseconds * 2) {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      if (data.start_date < yesterday) {
        throw new BadRequestException('Start date cannot be earlier than yesterday.')
      }
    }
  }

  private validateUpdateRules(data: Omit<UpdateCessationPlanType, 'id'>, existingPlan: any): void {
    if (data.start_date && data.target_date) {
      if (data.target_date <= data.start_date) {
        throw new BadRequestException('Target date must be after start date')
      }
    } else if (data.start_date && data.start_date >= existingPlan.target_date) {
      throw new BadRequestException('Start date must be before target date')
    } else if (data.target_date && data.target_date <= existingPlan.start_date) {
      throw new BadRequestException('Target date must be after start date')
    }
  }

  private async invalidatePlanCaches(planId: string, userId: string): Promise<void> {
    const cacheKeys = [
      buildOneCacheKey(CACHE_PREFIX, planId),
      buildCacheKey(CACHE_PREFIX, 'byUser', userId),
    ];

    await this.redisServices.getClient().del(cacheKeys);
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, userId);
  }

  private async invalidateUserRelatedCaches(userId: string): Promise<void> {
    const cacheKeys = [
      buildCacheKey(CACHE_PREFIX, 'byUser', userId),
    ];

    await this.redisServices.getClient().del(cacheKeys);
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, userId);
  }

  private async invalidateListCaches(): Promise<void> {
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, 'all-lists');
  }

  private async invalidateStatsCaches(): Promise<void> {
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, 'stats-cache');
  }

  private async invalidateTemplateCaches(templateId: string): Promise<void> {
    const templateCacheKey = buildOneCacheKey('cessation-plan-template', templateId);
    await this.redisServices.getClient().del(templateCacheKey);

    await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan-template', 'all-lists');
    await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan-template', 'items');
  }
}