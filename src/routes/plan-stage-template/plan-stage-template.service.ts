import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PlanStageTemplateRepository } from './plan-stage-template.repository'
import { CessationPlanTemplateRepository } from '../cessation-plan-template/cessation-plan-template.repository'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { CreatePlanStageTemplateType } from './schema/create-plan-stage-template.schema'
import { UpdatePlanStageTemplateType } from './schema/update-plan-stage-template.schema'
import { RedisServices } from 'src/shared/services/redis.service'
import {
  buildCacheKey,
  buildOneCacheKey,
  buildTrackerKey,
  invalidateCacheForId,
  reviveDates,
  trackCacheKey,
} from '../../shared/utils/cache-key.util'

const CACHE_TTL = 60 * 5
const CACHE_PREFIX = 'plan-stage-template'

@Injectable()
export class PlanStageTemplateService {
  private readonly logger = new Logger(PlanStageTemplateService.name);

  constructor(
    private readonly planStageTemplateRepository: PlanStageTemplateRepository,
    private readonly cessationPlanTemplateRepository: CessationPlanTemplateRepository,
    private readonly redisServices: RedisServices,
  ) {}

  async findAll(params: PaginationParamsType, templateId: string) {
    await this.validateTemplateExists(templateId);
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, templateId);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.data)) {
        reviveDates(parsed.data, ['created_at', 'updated_at']);
      } else {
        reviveDates(parsed, ['created_at', 'updated_at']);
      }
      return parsed;
    }
    const result = await this.planStageTemplateRepository.findAll(params, templateId);
    await this.redisServices.getClient().set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, templateId);
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      reviveDates(parsed, ['created_at', 'updated_at']);
      return parsed;
    }
    const stageTemplate = await this.planStageTemplateRepository.findOne(id);
    if (!stageTemplate) {
      throw new NotFoundException('Plan stage template not found');
    }
    await this.redisServices.getClient().set(cacheKey, JSON.stringify(stageTemplate), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, stageTemplate.template_id);
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);
    return stageTemplate;
  }

  async create(data: CreatePlanStageTemplateType, userRole: string) {
    await this.validateTemplateExists(data.template_id);
    await this.validateUniqueStageOrder(data.template_id, data.stage_order);

    try {
      const stageTemplate = await this.planStageTemplateRepository.create(data);
      this.logger.log(`Plan stage template created: ${stageTemplate.id}`);
      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, data.template_id);
      return stageTemplate;
    } catch (error) {
      this.logger.error(`Failed to create plan stage template: ${error.message}`);

      if (error.code === 'P2002') {
        throw new ConflictException('Stage order already exists for this template');
      }

      throw new BadRequestException('Failed to create plan stage template');
    }
  }

  async update(id: string, data: Omit<UpdatePlanStageTemplateType, 'id'>, userRole: string) {
    const existingStage = await this.findOne(id);

    if (data.template_id) {
      await this.validateTemplateExists(data.template_id);
    }

    if (data.stage_order !== undefined) {
      const templateId = data.template_id || existingStage.template_id;
      await this.validateUniqueStageOrder(templateId, data.stage_order, id);
    }

    try {
      const stageTemplate = await this.planStageTemplateRepository.update(id, data);
      this.logger.log(`Plan stage template updated: ${stageTemplate.id}`);
      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, existingStage.template_id);
      if (data.template_id && data.template_id !== existingStage.template_id) {
        await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, data.template_id);
      }
      return stageTemplate;
    } catch (error) {
      this.logger.error(`Failed to update plan stage template: ${error.message}`);

      if (error.code === 'P2002') {
        throw new ConflictException('Stage order already exists for this template');
      }

      throw new BadRequestException('Failed to update plan stage template');
    }
  }

  async remove(id: string, userRole: string) {
    const existingStage = await this.findOne(id);

    const stageTemplate = await this.planStageTemplateRepository.delete(id);
    this.logger.log(`Plan stage template deleted: ${id}`);
    // Invalidate all caches related to the parent template
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, existingStage.template_id);
    return stageTemplate;
  }

  async reorderStages(
    templateId: string,
    stageOrders: { id: string; order: number }[],
    userRole: string,
  ) {
    await this.validateTemplateExists(templateId);
    await this.validateStagesBelongToTemplate(templateId, stageOrders.map(s => s.id));

    this.validateOrderSequence(stageOrders);

    try {
      const reorderedStages = await this.planStageTemplateRepository.reorderStages(
        templateId,
        stageOrders,
      );
      this.logger.log(`Reordered ${stageOrders.length} stages for template: ${templateId}`);
      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, templateId);
      return reorderedStages;
    } catch (error) {
      this.logger.error(`Failed to reorder stages: ${error.message}`);
      throw new BadRequestException('Failed to reorder stages');
    }
  }

  private async validateTemplateExists(templateId: string): Promise<void> {
    const template = await this.cessationPlanTemplateRepository.findOne(templateId);
    if (!template) {
      throw new NotFoundException('Cessation plan template not found');
    }
  }

  private async validateUniqueStageOrder(
    templateId: string,
    stageOrder: number,
    excludeId?: string,
  ): Promise<void> {
    const existingStage = await this.planStageTemplateRepository.findByStageOrder(
      templateId,
      stageOrder,
    );

    if (existingStage && existingStage.id !== excludeId) {
      throw new ConflictException('Stage order already exists for this template');
    }
  }

  private async validateStagesBelongToTemplate(
    templateId: string,
    stageIds: string[],
  ): Promise<void> {
    const templateStageIds = await this.planStageTemplateRepository.getAllStageIdsByTemplate(templateId);
    const invalidIds = stageIds.filter(id => !templateStageIds.includes(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException('Some stages do not belong to the specified template');
    }
  }

  private validateOrderSequence(stageOrders: { id: string; order: number }[]): void {
    const orders = stageOrders.map(s => s.order);
    const uniqueOrders = new Set(orders);

    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Stage orders must be unique');
    }

    const sortedOrders = [...orders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        throw new BadRequestException('Stage orders must be sequential starting from 1');
      }
    }
  }
}