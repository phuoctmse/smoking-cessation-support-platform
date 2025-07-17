import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CessationPlanTemplateRepository } from './cessation-plan-template.repository'
import { CreateCessationPlanTemplateType } from './schema/create-cessation-plan-template.schema'
import { UpdateCessationPlanTemplateType } from './schema/update-cessation-plan-template.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { UserType } from '../user/schema/user.schema'
import { CessationPlanTemplateFiltersInput } from './dto/request/cessation-plan-template-filters.input'
import { RedisServices } from 'src/shared/services/redis.service'
import {
  buildCacheKey,
  buildOneCacheKey,
  buildTrackerKey,
  invalidateCacheForId,
  reviveDates,
  trackCacheKey,
} from '../../shared/utils/cache-key.util'
import { PlanStageTemplateRepository } from '../plan-stage-template/plan-stage-template.repository'
import { TemplateUsageFiltersInput } from './dto/request/template-usage-filters.input'
import { TemplateUsageStatsResponse, TemplateUserDetail } from './dto/response/template-usage-stats.response'

const CACHE_TTL = 60 * 5
const CACHE_PREFIX = 'cessation-plan-template'

@Injectable()
export class CessationPlanTemplateService {
  private readonly logger = new Logger(CessationPlanTemplateService.name)

  constructor(
    private readonly cessationPlanTemplateRepository: CessationPlanTemplateRepository,
    private readonly planStageTemplateRepository: PlanStageTemplateRepository,
    private readonly redisServices: RedisServices,
  ) {}

  async create(data: CreateCessationPlanTemplateType, user: UserType) {
    if (!data.name) {
      throw new ConflictException('Template name is required')
    }

    const existingTemplate = await this.cessationPlanTemplateRepository.findByName(data.name)
    if (existingTemplate) {
      throw new ConflictException('Template name already exists')
    }

    const template = await this.cessationPlanTemplateRepository.create({
      ...data,
      coach_id: user.id,
    })

    this.logger.log(`Cessation plan template created: ${template.id} by coach: ${user.id}`)

    // Invalidate template caches
    await this.invalidateTemplateCaches()

    return template
  }

  async findAll(
    params: PaginationParamsType,
    filters?: CessationPlanTemplateFiltersInput,
  ) {
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, filters)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        if (parsed.data && Array.isArray(parsed.data)) {
          parsed.data.forEach((template: any) => {
            reviveDates(template, ['created_at', 'updated_at'])
          })
        }
        return parsed
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for templates: ${error.message}`)
    }

    const result = await this.cessationPlanTemplateRepository.findAll(params, filters)

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(result))
      const trackerKey = buildTrackerKey(CACHE_PREFIX, 'all-lists')
      await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey)
      this.logger.debug(`Cache set for templates: ${cacheKey}`)
    } catch (error) {
      this.logger.warn(`Cache set failed for templates: ${error.message}`)
    }

    return result
  }

  async findOne(id: string) {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)
        reviveDates(parsed, ['created_at', 'updated_at'])
        this.logger.debug(`Cache hit for template: ${id}`)
        return parsed
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for template ${id}: ${error.message}`)
    }

    const template = await this.cessationPlanTemplateRepository.findOne(id)
    if (!template) {
      throw new NotFoundException('Cessation plan template not found')
    }

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(template))
      const trackerKey = buildTrackerKey(CACHE_PREFIX, 'items')
      await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey)
      this.logger.debug(`Cache set for template: ${id}`)
    } catch (error) {
      this.logger.warn(`Cache set failed for template ${id}: ${error.message}`)
    }

    return template
  }

  async update(id: string, data: Omit<UpdateCessationPlanTemplateType, 'id'>) {
    const existingTemplate = await this.cessationPlanTemplateRepository.findOne(id)
    if (!existingTemplate) {
      throw new NotFoundException('Cessation plan template not found')
    }

    if (data.name && data.name !== existingTemplate.name) {
      const templateWithSameName = await this.cessationPlanTemplateRepository.findByName(data.name)
      if (templateWithSameName) {
        throw new ConflictException('Template name already exists')
      }
    }

    const template = await this.cessationPlanTemplateRepository.update(id, data)
    this.logger.log(`Cessation plan template updated: ${template.id}`)

    // Invalidate specific template and related caches
    await this.invalidateTemplateCaches(id)

    return template
  }

  async updateTemplateDuration(templateId: string): Promise<void> {
    const totalDuration = await this.planStageTemplateRepository.sumDurationByTemplate(templateId)
    await this.cessationPlanTemplateRepository.update(templateId, {
      estimated_duration_days: totalDuration,
    })

    this.logger.log(`Updated estimated duration for template ${templateId} to ${totalDuration} days`)

    // Invalidate specific template and related caches
    await this.invalidateTemplateCaches(templateId)
  }

  async remove(id: string) {
    const existingTemplate = await this.cessationPlanTemplateRepository.findOne(id)
    if (!existingTemplate) {
      throw new NotFoundException('Cessation plan template not found')
    }

    const template = await this.cessationPlanTemplateRepository.delete(id)
    this.logger.log(`Cessation plan template deleted: ${template.id}`)

    // Invalidate specific template and related caches
    await this.invalidateTemplateCaches(id)

    return template
  }

  async getTemplateUsageStats(
    templateId: string,
    params: PaginationParamsType,
    filters: TemplateUsageFiltersInput | undefined,
    user: UserType,
  ): Promise<TemplateUsageStatsResponse> {
    const template = await this.cessationPlanTemplateRepository.findOne(templateId)
    if (!template) {
      throw new NotFoundException('Template not found')
    }

    if (template.coach_id !== user.id) {
      throw new ForbiddenException('You can only view usage stats for your own templates')
    }

    const cacheKey = buildCacheKey(CACHE_PREFIX, 'usage-stats', templateId, params, filters, user.id)

    try {
      const cached = await this.redisServices.getClient().get(cacheKey)
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached)

        if (parsed.users && Array.isArray(parsed.users.data)) {
          parsed.users.data.forEach((plan: any) => {
            reviveDates(plan, ['start_date', 'target_date', 'created_at', 'updated_at'])
          })
        }
        return this.transformToUsageStatsResponse(parsed)
      }
    } catch (error) {
      this.logger.warn(`Cache get failed for template usage stats ${templateId}: ${error.message}`)
    }

    const result = await this.cessationPlanTemplateRepository.getTemplateUsageStats(
      templateId,
      params,
      filters
    )

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(result))
    } catch (error) {
      this.logger.warn(`Cache set failed for template usage stats ${templateId}: ${error.message}`)
    }

    return this.transformToUsageStatsResponse(result)
  }

  private transformToUsageStatsResponse(data: any): TemplateUsageStatsResponse {
    return {
      template_id: data.template_id,
      template_name: data.template_name,
      total_users: data.total_users,
      stats_by_status: data.stats_by_status,
      users: {
        data: data.users.data.map((plan: any) => this.enrichPlanWithComputedFields(plan)),
        total: data.users.total,
        page: data.users.page,
        limit: data.users.limit,
        hasNext: data.users.hasNext,
      },
    }
  }

  private async invalidateTemplateCaches(templateId?: string): Promise<void> {
    try {
      const client = this.redisServices.getClient()

      // Step 1: Clear specific template cache if templateId provided
      if (templateId) {
        const specificTemplateKey = buildOneCacheKey(CACHE_PREFIX, templateId)
        await client.del(specificTemplateKey)
      }

      // Step 2: Clear all template list caches
      const templateListPatterns = [
        `${CACHE_PREFIX}:all:*`,
        `${CACHE_PREFIX}:usage-stats:*`,
      ]

      for (const pattern of templateListPatterns) {
        try {
          const keys = await client.keys(pattern)
          if (keys.length > 0) {
            await client.del(keys)
          }
        } catch (error) {
          this.logger.warn(`Failed to clear template cache pattern ${pattern}: ${error.message}`)
        }
      }

      // Step 3: Clear tracker keys
      const trackerKeys = [
        buildTrackerKey(CACHE_PREFIX, 'all-lists'),
        buildTrackerKey(CACHE_PREFIX, 'items'),
      ]

      for (const trackerKey of trackerKeys) {
        try {
          await invalidateCacheForId(client, CACHE_PREFIX, trackerKey.split(':').pop() || 'items')
        } catch (error) {
          this.logger.warn(`Failed to invalidate tracker key ${trackerKey}: ${error.message}`)
        }
      }

      this.logger.log(`Invalidated all template caches${templateId ? ` for template: ${templateId}` : ''}`)
    } catch (cacheError) {
      this.logger.error('Error invalidating template cache:', cacheError)
    }
  }

  private enrichPlanWithComputedFields(plan: any): TemplateUserDetail {
    const now = new Date()
    const startDate = new Date(plan.start_date)
    const targetDate = new Date(plan.target_date)

    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysToTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let completionPercentage = 0
    if (plan.stages && Array.isArray(plan.stages)) {
      const totalStages = plan.stages.length
      const completedStages = plan.stages.filter(
        (stage: any) => stage.status === 'COMPLETED'
      ).length

      if (totalStages > 0) {
        completionPercentage = (completedStages / totalStages) * 100
      }
    }

    return {
      id: plan.id,
      user_id: plan.user_id,
      status: plan.status,
      start_date: plan.start_date,
      target_date: plan.target_date,
      completion_percentage: parseFloat(completionPercentage.toFixed(2)),
      days_since_start: Math.max(0, daysSinceStart),
      days_to_target: Math.max(0, daysToTarget),
      is_overdue: now > targetDate && !['COMPLETED', 'CANCELLED'].includes(plan.status),
      user: {
        id: plan.user.id,
        name: plan.user.name,
        user_name: plan.user.user_name,
        avatar_url: plan.user.avatar_url,
      },
    }
  }
}