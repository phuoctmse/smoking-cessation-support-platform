import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { RedisServices } from '../../shared/services/redis.service';
import { buildCacheKey, buildOneCacheKey, invalidateCacheForId, reviveDates } from '../../shared/utils/cache-key.util'
import { HealthScoreCriteriaFilters, HealthScoreCriteriaRepository } from './health-score-criteria.repository'
import { CreateHealthScoreCriteriaType } from './dto/request/create-health-score-criteria.input'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { RoleName } from 'src/shared/constants/role.constant'
import { UpdateHealthScoreCriteriaType } from './dto/request/update-health-score-criteria.input';
import { RoleNameEnum, StatusEnum } from '../../shared/enums/graphql-enums'
import { HealthScoreCriteria } from './entities/health-score-criteria.entity'

const CACHE_TTL = 60 * 5;
const CACHE_PREFIX = 'health-score-criteria';

@Injectable()
export class HealthScoreCriteriaService {
  private readonly logger = new Logger(HealthScoreCriteriaService.name);

  constructor(
      private readonly repository: HealthScoreCriteriaRepository,
      private readonly redisServices: RedisServices,
  ) {}

  async create(data: CreateHealthScoreCriteriaType, userId: string, userRole: string) {
    this.validateCoachRole(userRole);

    const existing = await this.repository.findOneByCoachId(userId);
    if (existing) {
      throw new ConflictException(
          'Each coach can only create one health score criteria. Please update your existing one.',
      );
    }

    const criteriaData = {
      ...data,
      coach_id: userId,
    };

    const criteria = await this.repository.create(criteriaData);
    this.logger.log(`Health score criteria created: ${criteria.id} by coach: ${userId}`);
    await this.invalidateCriteriaCache(userId);

    return this.transformToEntity(criteria);
  }

  async findAll(
      params: PaginationParamsType,
      filters: HealthScoreCriteriaFilters = {},
      userRole: string,
      userId: string,
  ) {
    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId);

    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, effectiveFilters);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.data)) {
        parsed.data.forEach((criteria: any) => {
          reviveDates(criteria, ['created_at', 'updated_at']);
        });
        parsed.data = parsed.data.map((criteria: any) => this.transformToEntity(criteria));
      }
      return parsed;
    }

    const result = await this.repository.findAll(params, effectiveFilters);

    const transformedResult = {
      ...result,
      data: result.data.map((criteria) => this.transformToEntity(criteria)),
    };

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });

    return transformedResult;
  }

  async findOne(id: string, userRole: string, userId: string) {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      reviveDates(parsed, ['created_at', 'updated_at']);

      this.validateAccessPermission(parsed, userId, userRole);
      return this.transformToEntity(parsed);
    }

    const criteria = await this.repository.findOne(id);
    if (!criteria) {
      throw new NotFoundException('Health score criteria not found');
    }

    this.validateAccessPermission(criteria, userId, userRole);

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(criteria), { EX: CACHE_TTL });

    return this.transformToEntity(criteria);
  }

  async findByCoachId(coachId: string, requestUserId: string, userRole: string) {
    if (userRole === RoleName.Coach && coachId !== requestUserId) {
      throw new ForbiddenException('You can only access your own criteria');
    }

    const cacheKey = buildCacheKey(CACHE_PREFIX, 'byCoach', coachId);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((criteria: any) => {
          reviveDates(criteria, ['created_at', 'updated_at']);
        });
        return parsed.map((criteria: any) => this.transformToEntity(criteria));
      }
      return parsed;
    }

    const criteria = await this.repository.findByCoachId(coachId);
    await this.redisServices.getClient().set(cacheKey, JSON.stringify(criteria), { EX: CACHE_TTL });

    return criteria.map((criteria) => this.transformToEntity(criteria));
  }

  async update(id: string, data: Omit<UpdateHealthScoreCriteriaType, 'id'>, userRole: string, userId: string) {
    const existingCriteria = await this.repository.findOne(id);
    if (!existingCriteria) {
      throw new NotFoundException('Health score criteria not found');
    }

    this.validateUpdatePermission(existingCriteria, userId, userRole);

    const updatedCriteria = await this.repository.update(id, data);
    this.logger.log(`Health score criteria updated: ${updatedCriteria.id}`);
    await this.invalidateCriteriaCache(existingCriteria.coach_id, id);

    return this.transformToEntity(updatedCriteria);
  }

  async remove(id: string, userRole: string, userId: string) {
    const existingCriteria = await this.repository.findOne(id);
    if (!existingCriteria) {
      throw new NotFoundException('Health score criteria not found');
    }

    this.validateUpdatePermission(existingCriteria, userId, userRole);

    const removedCriteria = await this.repository.remove(id);
    this.logger.log(`Health score criteria removed: ${removedCriteria.id}`);
    await this.invalidateCriteriaCache(existingCriteria.coach_id, id);

    return this.transformToEntity(removedCriteria);
  }

  private validateCoachRole(userRole: string): void {
    if (userRole !== RoleName.Coach && userRole !== RoleName.Admin) {
      throw new ForbiddenException('Only coaches and admins can create health score criteria');
    }
  }

  private validateAccessPermission(criteria: any, userId: string, userRole: string): void {
    if (userRole === RoleName.Coach && criteria.coach_id !== userId) {
      throw new ForbiddenException('You can only access your own criteria');
    }
  }

  private validateUpdatePermission(criteria: any, userId: string, userRole: string): void {
    if (userRole === RoleName.Coach && criteria.coach_id !== userId) {
      throw new ForbiddenException('You can only update your own criteria');
    }
  }

  private applyRoleBasedFilters(
      filters: HealthScoreCriteriaFilters,
      userRole: string,
      userId: string,
  ): HealthScoreCriteriaFilters {
    const effectiveFilters = { ...filters };

    if (userRole === RoleName.Coach) {
      effectiveFilters.coach_id = userId;
    }

    return effectiveFilters;
  }

  private async invalidateCriteriaCache(coachId: string, criteriaId?: string): Promise<void> {
    try {
      const cacheKeys: string[] = [
        buildCacheKey(CACHE_PREFIX, 'byCoach', coachId),
      ];

      if (criteriaId) {
        cacheKeys.push(buildOneCacheKey(CACHE_PREFIX, criteriaId));
      }

      await this.redisServices.getClient().del(cacheKeys);
      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, coachId);
      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, 'all-lists');
    } catch (cacheError) {
      this.logger.error('Error invalidating cache:', cacheError);
    }
  }

  private transformToEntity(dbCriteria: any): HealthScoreCriteria {
    if (!dbCriteria) {
      return null;
    }

    const { coach: dbCoach, ...rest } = dbCriteria;

    const criteria: HealthScoreCriteria = {
      ...rest,
      coach: null,
    };

    if (dbCoach) {
      criteria.coach = {
        ...dbCoach,
        role: dbCoach.role as RoleNameEnum,
        status: dbCoach.status as StatusEnum,
      };
    }

    return criteria;
  }
}