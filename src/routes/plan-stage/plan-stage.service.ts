import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PlanStageStatus, Prisma } from '@prisma/client'
import { PlanStageFilters, PlanStageRepository } from './plan-stage.repository'
import { CessationPlanRepository } from '../cessation-plan/cessation-plan.repository'
import { RoleName } from '../../shared/constants/role.constant'
import { CreatePlanStageType } from './schema/create-plan-stage.schema'
import { UpdatePlanStageType } from './schema/update-plan-stage.schema'
import { PlanStage } from './entities/plan-stage.entity'
import { CessationPlan } from '../cessation-plan/entities/cessation-plan.entity'
import { BadgeAwardService } from '../badge-award/badge-award.service'
import { RedisServices } from 'src/shared/services/redis.service'
import {
  buildCacheKey,
  buildOneCacheKey,
  buildTrackerKey,
  invalidateCacheForId,
  reviveDates,
  trackCacheKey,
} from '../../shared/utils/cache-key.util'
import { NotificationEventService } from '../notification/notification.event'

const CACHE_TTL = 60 * 5
const CACHE_PREFIX = 'plan-stage'

@Injectable()
export class PlanStageService {
  private readonly logger = new Logger(PlanStageService.name)

  constructor(
    private readonly planStageRepository: PlanStageRepository,
    private readonly cessationPlanRepository: CessationPlanRepository,
    private readonly badgeAwardService: BadgeAwardService,
    private readonly redisServices: RedisServices,
    private readonly notificationEventService: NotificationEventService,
  ) {}

  async create(data: CreatePlanStageType, userRole: string, userId: string) {
    const plan = await this.validateAccessAndGetPlan(data.plan_id, userId, userRole)
    this.validatePlanIsCustomizable(plan)
    await this.validateCreateRules(data)

    try {
      const stage = await this.planStageRepository.create(data)
      this.logger.log(`Plan stage created: ${stage.id} for plan: ${stage.plan_id}`)
      await this.invalidateAllStageCaches('create', data.plan_id, plan.user_id, plan.template_id)
      return this.enrichWithComputedFields(stage)
    } catch (error) {
      this.handleDatabaseError(error)
    }
  }

  async createStagesFromTemplate(planId: string, userRole: string, userId: string) {
    const plan = await this.validateAccessAndGetPlan(planId, userId, userRole)
    if (!plan.template_id) {
      throw new BadRequestException('Plan must have a template to generate stages')
    }
    const existingStages = await this.planStageRepository.findByPlanId(planId)
    if (existingStages.length > 0) {
      throw new ConflictException(
        'Plan already has stages. If you want to customize, please do so manually or ensure the plan is empty before generating from template.',
      )
    }

    const result = await this.planStageRepository.createStagesFromTemplate(planId, plan.template_id, plan.start_date)
    this.logger.log(`Created ${result.count} stages for plan: ${planId}`)

    await this.invalidateAllStageCaches('template-generation', planId, plan.user_id, plan.template_id)

    const createdStages = await this.planStageRepository.findByPlanId(planId)
    return createdStages.map((stage) => this.enrichWithComputedFields(stage))
  }

  async findOne(id: string, userRole: string, userId: string) {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        reviveDates(parsed, ['start_date', 'end_date', 'created_at', 'updated_at'])
        return parsed
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for stage ${id}: ${error.message}`)
    }

    const stage = await this.planStageRepository.findOne(id)
    if (!stage) throw new NotFoundException('Plan stage not found')
    await this.validateAccessAndGetPlan(stage.plan_id, userId, userRole)

    const enriched = this.enrichWithComputedFields(stage)

    try {
      const trackerKey = buildTrackerKey(CACHE_PREFIX, stage.plan_id)
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(enriched))
      await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey)
    } catch (error) {
      this.logger.warn(`Cache set failed for stage ${id}: ${error.message}`)
    }

    return enriched
  }

  async findByPlanId(planId: string, userRole: string, userId: string) {
    await this.validateAccessAndGetPlan(planId, userId, userRole)
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'byPlan', planId)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        reviveDates(parsed, ['start_date', 'end_date', 'created_at', 'updated_at'])
        return parsed
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for plan stages ${planId}: ${error.message}`)
    }

    const stages = await this.planStageRepository.findByPlanId(planId)
    const enriched = stages.map((stage) => this.enrichWithComputedFields(stage))

    try {
      const trackerKey = buildTrackerKey(CACHE_PREFIX, planId)
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(enriched))
      await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey)
    } catch (error) {
      this.logger.warn(`Cache set failed for plan stages ${planId}: ${error.message}`)
    }

    return enriched
  }

  async findActiveByPlanId(planId: string, userRole: string, userId: string) {
    await this.validateAccessAndGetPlan(planId, userId, userRole)
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'activeByPlan', planId)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        reviveDates(parsed, ['start_date', 'end_date', 'created_at', 'updated_at'])
        return parsed
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for active plan stages ${planId}: ${error.message}`)
    }

    const stages = await this.planStageRepository.findActiveByPlanId(planId)
    const enriched = stages.map((stage) => this.enrichWithComputedFields(stage))

    try {
      const trackerKey = buildTrackerKey(CACHE_PREFIX, planId)
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(enriched))
      await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey)
    } catch (error) {
      this.logger.warn(`Cache set failed for active plan stages ${planId}: ${error.message}`)
    }

    return enriched
  }

  async getStageStatistics(filters?: PlanStageFilters, userRole?: string, userId?: string) {
    if (userRole === RoleName.Member) {
      throw new ForbiddenException('Only coaches and admins can access stage statistics')
    }

    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId)
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'statistics', effectiveFilters, userRole, userId)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        return JSON.parse(cached)
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for stage statistics: ${error.message}`)
    }

    const statistics = await this.planStageRepository.getStageStatistics(effectiveFilters)

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(statistics))
    } catch (error) {
      this.logger.warn(`Cache set failed for stage statistics: ${error.message}`)
    }

    return statistics
  }

  async update(id: string, data: Omit<UpdatePlanStageType, 'id'>, userRole: string, userId: string) {
    const existingStage = await this.planStageRepository.findOne(id)
    if (!existingStage) {
      throw new NotFoundException('Plan stage not found')
    }

    const plan = await this.validateAccessAndGetPlan(existingStage.plan_id, userId, userRole)

    if (data.status !== undefined) {
      this.validateStatusTransition(existingStage.status, data.status, existingStage)
    }

    if (plan.is_custom === true) {
      this.validateUpdateRules(data, existingStage)
    }

    try {
      const updatedStage = await this.planStageRepository.update(id, data)

      if (updatedStage.status === PlanStageStatus.COMPLETED) {
        const planStages = await this.planStageRepository.findByPlanId(updatedStage.plan_id)
        const completedStagesInPlan = planStages.filter((s) => s.status === PlanStageStatus.COMPLETED).length

        await this.badgeAwardService.processStageCompletion(userId, updatedStage.plan_id, completedStagesInPlan)
        const planDisplayName = this.getPlanDisplayName(plan)

        await this.notificationEventService.sendStageCompletionNotification(userId, updatedStage.title, planDisplayName)
      }

      await this.invalidateAllStageCaches(id, existingStage.plan_id, plan.user_id, plan.template_id)

      return this.enrichWithComputedFields(updatedStage)
    } catch (error) {
      this.handleDatabaseError(error)
    }
  }

  async reorderStages(planId: string, stageOrders: { id: string; order: number }[], userRole: string, userId: string) {
    const plan = await this.validateAccessAndGetPlan(planId, userId, userRole)
    this.validatePlanIsCustomizable(plan)
    await this.validateStagesBelongToPlan(
      planId,
      stageOrders.map((s) => s.id),
    )
    this.validateOrderSequence(stageOrders)

    try {
      const reorderedStages = await this.planStageRepository.reorderStages(planId, stageOrders)
      this.logger.log(`Reordered ${stageOrders.length} stages for plan: ${planId}`)

      await this.invalidateAllStageCaches('reorder', planId, plan.user_id, plan.template_id)

      return reorderedStages.map((stage) => this.enrichWithComputedFields(stage))
    } catch (error) {
      this.logger.error(`Failed to reorder stages: ${error.message}`)
      throw new BadRequestException('Failed to reorder stages')
    }
  }

  async remove(id: string, userRole: string, userId: string): Promise<PlanStage> {
    const existingStage = await this.planStageRepository.findOne(id)
    if (!existingStage) {
      throw new NotFoundException('Plan stage not found')
    }

    const plan = await this.validateAccessAndGetPlan(existingStage.plan_id, userId, userRole)
    this.validatePlanIsCustomizable(plan)

    try {
      const removedStage = await this.planStageRepository.remove(id)
      await this.invalidateAllStageCaches(id, existingStage.plan_id, plan.user_id, plan.template_id)
      return this.enrichWithComputedFields(removedStage)
    } catch (error) {
      this.handleDatabaseError(error)
    }
  }

  private async invalidateAllStageCaches(
    operationType: string,
    planId: string,
    userId: string,
    templateId?: string,
  ): Promise<void> {
    try {
      const client = this.redisServices.getClient()

      // Clear specific stage cache (except for operation types)
      if (operationType && !['create', 'template-generation', 'reorder'].includes(operationType)) {
        const specificStageKey = buildOneCacheKey(CACHE_PREFIX, operationType)
        await client.del(specificStageKey)
      }

      // Clear all stage-related caches with pattern-based approach
      const cachePatterns = [
        `${CACHE_PREFIX}:byPlan:${planId}*`,
        `${CACHE_PREFIX}:activeByPlan:${planId}*`,
        `${CACHE_PREFIX}:statistics:*`,
        `${CACHE_PREFIX}:one:*`,
        `cessation-plan:one:${planId}*`,
        `cessation-plan:byUser:${userId}*`,
        `cessation-plan:all:*`,
        `cessation-plan:stats:*`,
        `progress-record:*:${planId}:*`,
        `progress-record:*:${userId}:*`,
        `leaderboard:*:${userId}:*`,
        `streak:*`,
        `badge:*:${userId}:*`,
        `achievement:*:${userId}:*`,
        `notification:*:${userId}:*`,
        `user-notifications:${userId}:*`,
      ]

      // Add template usage patterns if templateId exists
      if (templateId) {
        cachePatterns.push(`cessation-plan-template:usage-stats:${templateId}:*`)
      }

      // Clear all patterns
      for (const pattern of cachePatterns) {
        await this.clearCachePattern(client, pattern)
      }

      // Clear specific cache keys
      const specificCacheKeys = [
        buildOneCacheKey('cessation-plan', planId),
        buildCacheKey('cessation-plan', 'byUser', userId),
      ]

      if (specificCacheKeys.length > 0) {
        await client.del(specificCacheKeys)
      }

      // Clear using invalidateCacheForId utility
      await invalidateCacheForId(client, CACHE_PREFIX, planId)
      await invalidateCacheForId(client, 'cessation-plan', userId)
      await invalidateCacheForId(client, 'cessation-plan', 'all-lists')
      await invalidateCacheForId(client, 'cessation-plan', 'stats-cache')

    } catch (cacheError) {
      this.logger.error(`Error invalidating stage caches: ${cacheError.message}`, cacheError)
    }
  }

  // Utility method to clear cache patterns
  private async clearCachePattern(client: any, pattern: string): Promise<void> {
    try {
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(keys)
      }
    } catch (error) {
      this.logger.warn(`Failed to clear cache pattern ${pattern}: ${error.message}`)
    }
  }

  private applyRoleBasedFilters(filters?: PlanStageFilters, userRole?: string, userId?: string): PlanStageFilters {
    const effectiveFilters = { ...filters }

    if (userRole === RoleName.Member && userId) {
      effectiveFilters.user_id = userId
    }

    return effectiveFilters
  }

  private getPlanDisplayName(plan: any): string {
    if (plan.template && plan.template.name) {
      return plan.template.name
    }

    if (plan.reason) {
      return `Kế hoạch: ${plan.reason}`
    }

    return 'Kế hoạch cai thuốc'
  }

  private enrichWithComputedFields(stage: any): PlanStage {
    const now = new Date()
    const startDate = stage.start_date ? new Date(stage.start_date) : null
    const endDate = stage.end_date ? new Date(stage.end_date) : null

    let daysSinceStart = 0
    let daysToEnd = 0
    let isOverdue = false

    if (startDate) {
      daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    }
    if (endDate) {
      daysToEnd = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (now > endDate && stage.status !== PlanStageStatus.COMPLETED) {
        isOverdue = true
      }
    }

    return {
      ...stage,
      days_since_start: daysSinceStart,
      days_to_end: daysToEnd,
      is_overdue: isOverdue,
      can_start: this.canStartStage(stage),
      can_complete: this.canCompleteStage(stage),
    } as PlanStage
  }

  private canStartStage(stage: any): boolean {
    if (stage.status !== PlanStageStatus.PENDING) {
      return false
    }

    if (!stage.start_date) {
      return true
    }

    const now = new Date()
    const stageStartDate = new Date(stage.start_date)

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const startDateOnly = new Date(stageStartDate)
    startDateOnly.setHours(0, 0, 0, 0)

    return startDateOnly <= today
  }

  private canCompleteStage(stage: any): boolean {
    return stage.status === PlanStageStatus.ACTIVE
  }

  private async validateAccessAndGetPlan(planId: string, userId: string, userRole: string): Promise<CessationPlan> {
    const plan = await this.cessationPlanRepository.findOne(planId)
    if (!plan) {
      throw new NotFoundException('Cessation plan not found')
    }

    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only access stages of your own plans')
    }
    return plan as unknown as CessationPlan
  }

  private validateStatusTransition(currentStatus: PlanStageStatus, newStatus: PlanStageStatus, stage?: any): void {
    const validTransitions: Record<PlanStageStatus, PlanStageStatus[]> = {
      PENDING: ['ACTIVE', 'SKIPPED'],
      ACTIVE: ['COMPLETED', 'SKIPPED', 'PENDING'],
      COMPLETED: [],
      SKIPPED: ['PENDING'],
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`)
    }

    if (currentStatus === PlanStageStatus.PENDING && newStatus === PlanStageStatus.ACTIVE) {
      this.validateCanActivateStage(stage)
    }
  }

  private validateCanActivateStage(stage: any): void {
    if (!stage?.start_date) {
      return
    }

    const now = new Date()
    const stageStartDate = new Date(stage.start_date)

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const startDateOnly = new Date(stageStartDate)
    startDateOnly.setHours(0, 0, 0, 0)

    if (startDateOnly > today) {
      const daysUntilStart = Math.ceil((startDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      throw new BadRequestException(
        `Cannot activate stage before its start date. Stage can be activated in ${daysUntilStart} day(s) (${stageStartDate.toDateString()}).`,
      )
    }
  }

  private async validateCreateRules(data: CreatePlanStageType): Promise<void> {
    const existingStage = await this.planStageRepository.findByStageOrder(data.plan_id, data.stage_order)
    if (existingStage) {
      throw new ConflictException('Stage order already exists for this plan')
    }

    if (data.start_date && data.end_date && data.end_date <= data.start_date) {
      throw new BadRequestException('End date must be after start date')
    }
  }

  private validateUpdateRules(data: Omit<UpdatePlanStageType, 'id'>, existingStage: any): void {
    if (data.start_date && data.end_date) {
      if (data.end_date <= data.start_date) {
        throw new BadRequestException('End date must be after start date')
      }
    } else if (data.start_date && existingStage.end_date && data.start_date >= existingStage.end_date) {
      throw new BadRequestException('Start date must be before existing end date')
    } else if (data.end_date && existingStage.start_date && data.end_date <= existingStage.start_date) {
      throw new BadRequestException('End date must be after existing start date')
    }
  }

  private validatePlanIsCustomizable(plan: CessationPlan): void {
    if (plan.is_custom === false) {
      throw new ForbiddenException(
        'This plan is not customizable. Stages cannot be manually created, updated, or reordered.',
      )
    }
  }

  private async validateStagesBelongToPlan(planId: string, stageIds: string[]): Promise<void> {
    const planStages = await this.planStageRepository.findByPlanId(planId)
    const planStageIds = planStages.map((stage) => stage.id)
    const invalidIds = stageIds.filter((id) => !planStageIds.includes(id))

    if (invalidIds.length > 0) {
      throw new BadRequestException('Some stages do not belong to the specified plan')
    }
  }

  private validateOrderSequence(stageOrders: { id: string; order: number }[]): void {
    const orders = stageOrders.map((s) => s.order)
    const uniqueOrders = new Set(orders)

    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Stage orders must be unique')
    }

    const sortedOrders = [...orders].sort((a, b) => a - b)
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        throw new BadRequestException('Stage orders must be sequential starting from 1')
      }
    }
  }

  private handleDatabaseError(error: any): never {
    this.logger.error(`Database Error: ${error.message}`, error.stack)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A stage with similar unique data (e.g., plan_id and stage_order) already exists.')
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'The resource to update or delete was not found. It might have been already removed.',
        )
      }
    }
    throw new BadRequestException('Failed to process plan stage operation due to a database issue.')
  }
}