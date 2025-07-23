import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CessationPlanRepository } from '../cessation-plan/cessation-plan.repository'
import { ProgressRecordRepository } from './progress-record.repository'
import { CreateProgressRecordType } from './schema/create-progress-record.schema'
import { UserType } from '../user/schema/user.schema'
import { ProgressRecord } from './entities/progress-record.entity'
import { UpdateProgressRecordType } from './schema/update-progress-record.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { ProgressRecordFiltersInput } from './dto/request/progress-record-filters.input'
import { BadgeAwardService } from '../badge-award/badge-award.service'
import { LeaderboardService } from '../leaderboard/leaderboard.service'
import { RedisServices } from '../../shared/services/redis.service'
import {
  buildCacheKey,
  buildOneCacheKey, invalidateCacheForId,
  reviveDates,
} from '../../shared/utils/cache-key.util'

const CACHE_TTL = 60 * 5;
const CACHE_PREFIX = 'progress-record';

@Injectable()
export class ProgressRecordService {
  private readonly logger = new Logger(ProgressRecordService.name);

  constructor(
    private readonly progressRecordRepository: ProgressRecordRepository,
    private readonly cessationPlanRepository: CessationPlanRepository,
    private readonly badgeAwardService: BadgeAwardService,
    private readonly leaderboardService: LeaderboardService,
    private readonly redisServices: RedisServices,
  ) {}

  async create(data: CreateProgressRecordType, user: UserType): Promise<ProgressRecord> {
    await this.validatePlanOwnership(data.plan_id, user.id);
    this.validateRecordDate(data.record_date);

    const existingRecord = await this.progressRecordRepository.findAnyByPlanIdAndDate(data.plan_id, data.record_date);

    if (existingRecord) {
      if (existingRecord.is_deleted) {
        const { id, ...updateData } = { ...data, id: existingRecord.id };
        return this.update(id, updateData, user, true);
      } else {
        throw new ConflictException('A progress record for this date already exists for this plan.');
      }
    }

    const record = await this.progressRecordRepository.create(data);
    this.logger.log(`Progress record created: ${record.id} for plan: ${record.plan_id}`);

    await this.processStreakAndBadges(user.id, record.plan_id, data.cigarettes_smoked);
    await this.invalidateAllRelatedCaches(record.plan_id, user.id, record.id);

    return record as ProgressRecord;
  }

  async findAll(params: PaginationParamsType, filters: ProgressRecordFiltersInput | undefined, user: UserType) {
    const effectiveFilters = this.validateAndBuildFilters(filters, user.id);
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, effectiveFilters, user.id);

    try {
      const cached = await this.redisServices.getClient().get(cacheKey);
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.data)) {
          parsed.data.forEach((record: any) => {
            reviveDates(record, ['record_date', 'created_at', 'updated_at']);
          });
        }
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
    }

    const result = await this.progressRecordRepository.findAll(params, effectiveFilters);

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }

    return result;
  }

  async findOne(id: string, user: UserType): Promise<ProgressRecord> {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id);

    try {
      const cached = await this.redisServices.getClient().get(cacheKey);
      if (typeof cached === 'string') {
        const parsed = JSON.parse(cached);
        reviveDates(parsed, ['record_date', 'created_at', 'updated_at']);
        await this.validateRecordOwnership(parsed, user.id);
        return parsed as ProgressRecord;
      }
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
    }

    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    await this.validateRecordOwnership(record, user.id);

    try {
      await this.redisServices.getClient().setEx(cacheKey, CACHE_TTL, JSON.stringify(record));
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }

    return record as ProgressRecord;
  }

  async update(id: string, data: Omit<UpdateProgressRecordType, 'id' | 'plan_id'>, user: UserType, isReactivating = false): Promise<ProgressRecord> {
    const record = await this.progressRecordRepository.findOneWithAnyStatus(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    await this.validateRecordOwnership(record, user.id);

    if (data.record_date) {
      this.validateRecordDate(data.record_date);
      await this.validateUniqueRecordForUpdate(record.plan_id, data.record_date, id);
    }

    const updateData = { ...data };
    if (isReactivating) {
      (updateData as any).is_deleted = false;
    }

    const updatedRecord = await this.progressRecordRepository.update(id, updateData);
    if (!updatedRecord) {
      throw new NotFoundException('Progress record not found or already deleted.');
    }

    this.logger.log(`Progress record updated: ${updatedRecord.id}`);

    if (data.cigarettes_smoked !== undefined) {
      await this.processStreakAndBadges(user.id, updatedRecord.plan_id, data.cigarettes_smoked);
    }

    await this.invalidateAllRelatedCaches(updatedRecord.plan_id, user.id, id);

    return updatedRecord as ProgressRecord;
  }

  async remove(id: string, user: UserType): Promise<ProgressRecord> {
    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    await this.validateRecordOwnership(record, user.id);

    const removedRecord = await this.progressRecordRepository.remove(id);
    if (!removedRecord) {
      throw new NotFoundException('Progress record not found or already deleted.');
    }

    this.logger.log(`Progress record removed: ${removedRecord.id}`);
    await this.invalidateAllRelatedCaches(removedRecord.plan_id, user.id, id);

    return removedRecord as ProgressRecord;
  }

  private async validatePlanOwnership(planId: string, userId: string): Promise<void> {
    const plan = await this.cessationPlanRepository.findOne(planId);
    if (!plan) {
      throw new NotFoundException('Cessation plan not found.');
    }
    if (plan.user_id !== userId) {
      throw new ForbiddenException('You can only add progress records to your own plans.');
    }
  }

  private async validateRecordOwnership(record: any, userId: string): Promise<void> {
    const plan = await this.cessationPlanRepository.findOne(record.plan_id);
    if (!plan) {
      throw new NotFoundException('Associated cessation plan not found.');
    }
    if (plan.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this progress record.');
    }
  }

  private validateRecordDate(recordDate: Date): void {
    if (recordDate > new Date()) {
      throw new BadRequestException('Record date cannot be in the future.');
    }
  }

  private async validateUniqueRecordForUpdate(planId: string, recordDate: Date, currentRecordId: string): Promise<void> {
    const existingRecord = await this.progressRecordRepository.findByPlanIdAndDate(planId, recordDate);
    if (existingRecord && existingRecord.id !== currentRecordId) {
      throw new ConflictException('A progress record for the new date already exists for this plan.');
    }
  }

  private validateAndBuildFilters(filters: ProgressRecordFiltersInput | undefined, userId: string) {
    const effectiveFilters = { ...filters };

    if (!effectiveFilters.planId) {
      throw new ForbiddenException('Members must specify a plan ID to view progress records.');
    }

    return effectiveFilters;
  }

  private async processStreakAndBadges(userId: string, planId: string, cigarettesSmoked: number): Promise<void> {
    try {
      const currentStreak = await this.calculateUserStreak(planId);
      const prevStreak = await this.leaderboardService.getUserStreak(userId) || 0;

      await this.leaderboardService.updateUserStreak(userId, currentStreak);

      if (cigarettesSmoked === 0 && currentStreak > 0) {
        await this.badgeAwardService.processStreakUpdate(userId, currentStreak);
      }

    } catch (error) {
      this.logger.error(`Error processing streak and badges for user ${userId}: ${error.message}`);
    }
  }

  private async calculateUserStreak(planId: string): Promise<number> {
    const records = await this.progressRecordRepository.findAll(
      { page: 1, limit: 1000, orderBy: 'record_date', sortOrder: 'desc' },
      { planId }
    );

    if (records.data.length === 0) {
      return 0;
    }

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setUTCHours(0, 0, 0, 0);

    const mostRecentRecordDate = new Date(records.data[0].record_date);
    mostRecentRecordDate.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    if (mostRecentRecordDate.getTime() < yesterday.getTime()) {
      return 0;
    }

    if (mostRecentRecordDate.getTime() !== expectedDate.getTime()) {
      expectedDate = mostRecentRecordDate;
    }

    for (const record of records.data) {
      const recordDate = new Date(record.record_date);
      recordDate.setUTCHours(0, 0, 0, 0);

      if (recordDate.getTime() === expectedDate.getTime() && record.cigarettes_smoked === 0) {
        streak++;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private async invalidateAllRelatedCaches(planId: string, userId: string, recordId?: string): Promise<void> {
    try {
      const client = this.redisServices.getClient();
      if (recordId) {
        const specificRecordKey = buildOneCacheKey(CACHE_PREFIX, recordId);
        await client.del(specificRecordKey);
      }

      const progressCachePatterns = [
        `${CACHE_PREFIX}:all:*`,
        `${CACHE_PREFIX}:*:${planId}:*`,
        `${CACHE_PREFIX}:*:${userId}:*`,
      ];

      for (const pattern of progressCachePatterns) {
        try {
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            await client.del(keys);
          }
        } catch (error) {
          this.logger.warn(`Failed to clear progress cache pattern ${pattern}: ${error.message}`);
        }
      }

      const planStageCachePatterns = [
        `plan-stage:charts:${planId}:*`,
        `plan-stage:charts:*`,
        `plan-stage:byPlan:${planId}*`,
        `plan-stage:activeByPlan:${planId}*`,
        `plan-stage:statistics:*`,
      ];

      for (const pattern of planStageCachePatterns) {
        try {
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            await client.del(keys);
          }
        } catch (error) {
          this.logger.warn(`Failed to clear plan stage cache pattern ${pattern}: ${error.message}`);
        }
      }

      const planCachePatterns = [
        `cessation-plan:*:${planId}:*`,
        `cessation-plan:*:${userId}:*`,
        `cessation-plan:all:*`,
      ];

      for (const pattern of planCachePatterns) {
        try {
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            await client.del(keys);
          }
        } catch (error) {
          this.logger.warn(`Failed to clear plan cache pattern ${pattern}: ${error.message}`);
        }
      }

      const leaderboardPatterns = [
        `leaderboard:*:${userId}:*`,
        `streak:*`,
      ];

      for (const pattern of leaderboardPatterns) {
        try {
          const keys = await client.keys(pattern);
          if (keys.length > 0) {
            await client.del(keys);
          }
        } catch (error) {
          this.logger.warn(`Failed to clear leaderboard cache pattern ${pattern}: ${error.message}`);
        }
      }

      await invalidateCacheForId(client, 'plan-stage', planId);
      await invalidateCacheForId(client, 'cessation-plan', userId);
      await invalidateCacheForId(client, 'cessation-plan', 'stats-cache');

      this.logger.log(`Invalidated all related caches for plan: ${planId}, user: ${userId}`);
    } catch (cacheError) {
      this.logger.error('Error invalidating progress record cache:', cacheError);
    }
  }
}