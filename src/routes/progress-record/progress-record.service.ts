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
  buildOneCacheKey,
  invalidateCacheForId,
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
    await this.validateUniqueRecord(data.plan_id, data.record_date);

    const record = await this.progressRecordRepository.create(data);
    this.logger.log(`Progress record created: ${record.id} for plan: ${record.plan_id}`);
    await this.processStreakAndBadges(user.id, record.plan_id, data.cigarettes_smoked);
    await this.invalidateRecordCaches(record.plan_id, user.id);

    return record as ProgressRecord;
  }

  async findAll(params: PaginationParamsType, filters: ProgressRecordFiltersInput | undefined, user: UserType) {
    const effectiveFilters = this.validateAndBuildFilters(filters, user.id);
    const cacheKey = buildCacheKey(CACHE_PREFIX, 'all', params, effectiveFilters, user.id);
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
    const result = await this.progressRecordRepository.findAll(params, effectiveFilters);
    await this.redisServices.getClient().set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });

    return result;
  }

  async findOne(id: string, user: UserType): Promise<ProgressRecord> {
    const cacheKey = buildOneCacheKey(CACHE_PREFIX, id);
    const cached = await this.redisServices.getClient().get(cacheKey);
    if (typeof cached === 'string') {
      const parsed = JSON.parse(cached);
      reviveDates(parsed, ['record_date', 'created_at', 'updated_at']);

      await this.validateRecordOwnership(parsed, user.id);
      return parsed as ProgressRecord;
    }

    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    await this.validateRecordOwnership(record, user.id);

    await this.redisServices.getClient().set(cacheKey, JSON.stringify(record), { EX: CACHE_TTL });

    return record as ProgressRecord;
  }

  async update(id: string, data: Omit<UpdateProgressRecordType, 'id' | 'plan_id'>, user: UserType): Promise<ProgressRecord> {
    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    await this.validateRecordOwnership(record, user.id);

    if (data.record_date) {
      this.validateRecordDate(data.record_date);
      await this.validateUniqueRecordForUpdate(record.plan_id, data.record_date, id);
    }

    const updatedRecord = await this.progressRecordRepository.update(id, data);
    if (!updatedRecord) {
      throw new NotFoundException('Progress record not found or already deleted.');
    }

    this.logger.log(`Progress record updated: ${updatedRecord.id}`);

    // Handle streak and badge processing if cigarettes_smoked changed
    if (data.cigarettes_smoked !== undefined) {
      await this.processStreakAndBadges(user.id, updatedRecord.plan_id, data.cigarettes_smoked);
    }

    await this.invalidateRecordCaches(updatedRecord.plan_id, user.id, id);

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

    await this.invalidateRecordCaches(removedRecord.plan_id, user.id, id);

    return removedRecord as ProgressRecord;
  }

  // Private helper methods
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

  private async validateUniqueRecord(planId: string, recordDate: Date): Promise<void> {
    const existingRecord = await this.progressRecordRepository.findByPlanIdAndDate(planId, recordDate);
    if (existingRecord) {
      throw new ConflictException('A progress record for this date already exists for this plan.');
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
    const currentStreak = await this.calculateUserStreak(planId);
    const prevStreak = await this.leaderboardService.getUserStreak(userId) || 0;

    if (currentStreak !== prevStreak) {
      await this.leaderboardService.updateUserStreak(userId, currentStreak);
    }

    if (cigarettesSmoked === 0) {
      await this.badgeAwardService.processStreakUpdate(userId, currentStreak);
    }
  }

  private async calculateUserStreak(planId: string): Promise<number> {
    const records = await this.progressRecordRepository.findAll(
      { page: 1, limit: 1000, orderBy: 'record_date', sortOrder: 'desc' },
      { planId }
    );

    let streak = 0;
    for (const record of records.data) {
      if (record.cigarettes_smoked === 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private async invalidateRecordCaches(planId: string, userId: string, recordId?: string): Promise<void> {
    try {
      const cacheKeys: string[] = [];

      if (recordId) {
        cacheKeys.push(buildOneCacheKey(CACHE_PREFIX, recordId));
      }

      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, planId);
      await invalidateCacheForId(this.redisServices.getClient(), CACHE_PREFIX, userId);

      if (cacheKeys.length > 0) {
        await this.redisServices.getClient().del(cacheKeys);
      }

      this.logger.log(`Invalidated progress record caches for plan: ${planId}`);
    } catch (cacheError) {
      this.logger.error('Error invalidating progress record cache:', cacheError);
    }
  }
}