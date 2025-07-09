import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
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

const CACHE_TTL = 60 * 5
const CACHE_PREFIX = 'cessation-plan-template'

@Injectable()
export class CessationPlanTemplateService {
  private readonly logger = new Logger(CessationPlanTemplateService.name)

  constructor(
    private readonly cessationPlanTemplateRepository: CessationPlanTemplateRepository,
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
        }
    )
    this.logger.log(`Cessation plan template created: ${template.id} by coach: ${user.id}`)
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, 'all-lists');
    return template;
  }

  async findAll(
    params: PaginationParamsType,
    filters?: CessationPlanTemplateFiltersInput,
  ) {
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, filters);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      reviveDates(parsed.data, ['created_at', 'updated_at']);
      return parsed;
    }
    const result = await this.cessationPlanTemplateRepository.findAll(params, filters);
    await this.redisServices.getClient().set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, 'all-lists');
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);
    return result;
  }

  async findOne(id: string) {
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'one', id);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      reviveDates(parsed, ['created_at', 'updated_at']);
      return parsed;
    }
    const template = await this.cessationPlanTemplateRepository.findOne(id);

    if (!template) {
      throw new NotFoundException('Cessation plan template not found');
    }

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(template), { EX: CACHE_TTL });
    const trackerKey = buildTrackerKey(CACHE_PREFIX, 'items');
    await trackCacheKey(this.redisServices.getClient(), trackerKey, cacheKey);
    return template;
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
    await this.redisServices.getClient().del(buildOneCacheKey(CACHE_PREFIX, id));
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, 'all-lists');
    return template
  }

  async remove(id: string, userRole: string) {
    const existingTemplate = await this.cessationPlanTemplateRepository.findOne(id)
    if (!existingTemplate) {
      throw new NotFoundException('Cessation plan template not found')
    }

    const template = await this.cessationPlanTemplateRepository.delete(id)
    this.logger.log(`Cessation plan template deleted: ${template.id}`)
    await this.redisServices.getClient().del(buildOneCacheKey(CACHE_PREFIX, id));
    await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, 'all-lists');
    return template
  }
}