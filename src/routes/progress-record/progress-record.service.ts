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
import { RoleName } from 'src/shared/constants/role.constant'
import { UpdateProgressRecordType } from './schema/update-progress-record.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { ProgressRecordFiltersInput } from './dto/request/progress-record-filters.input'
import { BadgeAwardService } from '../badge-award/badge-award.service'
import { LeaderboardService } from '../leaderboard/leaderboard.service'

@Injectable()
export class ProgressRecordService {
  private readonly logger = new Logger(ProgressRecordService.name);

  constructor(
    private readonly progressRecordRepository: ProgressRecordRepository,
    private readonly cessationPlanRepository: CessationPlanRepository,
    private readonly badgeAwardService: BadgeAwardService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async create(data: CreateProgressRecordType, user: UserType): Promise<ProgressRecord> {
    const plan = await this.cessationPlanRepository.findOne(data.plan_id);
    if (!plan) {
      throw new NotFoundException('Cessation plan not found.');
    }
    if (plan.user_id !== user.id) {
      throw new ForbiddenException('You can only add progress records to your own plans.');
    }

    if (data.record_date > new Date()) {
      throw new BadRequestException('Record date cannot be in the future.');
    }

    const existingRecord = await this.progressRecordRepository.findByPlanIdAndDate(data.plan_id, data.record_date);
    if (existingRecord) {
      throw new ConflictException('A progress record for this date already exists for this plan.');
    }

    try {
      const record = await this.progressRecordRepository.create(data);
      this.logger.log(`Progress record created: ${record.id} for plan: ${record.plan_id}`);
      const currentStreak = await this.calculateUserStreak(user.id, record.plan_id);
      const prevStreak = await this.leaderboardService.getUserStreak(user.id) || 0;
      if (currentStreak !== prevStreak) {
        await this.leaderboardService.updateUserStreak(user.id, currentStreak);
      }
      if (data.cigarettes_smoked === 0) {
        await this.badgeAwardService.processStreakUpdate(user.id, currentStreak);
      }
      return record as ProgressRecord;
    } catch (error) {
      this.logger.error(`Failed to create progress record: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create progress record.');
    }
  }

  async findAll(params: PaginationParamsType, filters: ProgressRecordFiltersInput | undefined, user: UserType) {
    const effectiveFilters = { ...filters };

    if (user.role === RoleName.Member) {
      if (effectiveFilters.planId) {
        const plan = await this.cessationPlanRepository.findOne(effectiveFilters.planId);
        if (!plan || plan.user_id !== user.id) {
          throw new ForbiddenException('You can only view progress records for your own plans.');
        }
      } else {
        throw new ForbiddenException('Members must specify a plan ID to view progress records.');
      }
    }

    return this.progressRecordRepository.findAll(params, effectiveFilters);
  }

  async findOne(id: string, user: UserType): Promise<ProgressRecord> {
    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    const plan = await this.cessationPlanRepository.findOne(record.plan_id);
    if (!plan) {
      throw new NotFoundException('Associated cessation plan not found.');
    }
    if (plan.user_id !== user.id) {
      throw new ForbiddenException('You do not have permission to view this progress record.');
    }
    return record as ProgressRecord;
  }

  async update(id: string, data: Omit<UpdateProgressRecordType, 'id' | 'plan_id'>, user: UserType): Promise<ProgressRecord> {
    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    const plan = await this.cessationPlanRepository.findOne(record.plan_id);
    if (!plan) {
      throw new NotFoundException('Associated cessation plan not found.');
    }
    if (plan.user_id !== user.id) {
      throw new ForbiddenException('You can only update progress records of your own plans.');
    }

    if (data.record_date) {
      if (data.record_date > new Date()) {
        throw new BadRequestException('Record date cannot be in the future.');
      }
      const existingRecordWithNewDate = await this.progressRecordRepository.findByPlanIdAndDate(record.plan_id, data.record_date);
      if (existingRecordWithNewDate && existingRecordWithNewDate.id !== id) {
        throw new ConflictException('A progress record for the new date already exists for this plan.');
      }
    }
    
    try {
      const updatedRecord = await this.progressRecordRepository.update(id, data);
      if (!updatedRecord) throw new NotFoundException('Progress record not found or already deleted.');
      this.logger.log(`Progress record updated: ${updatedRecord.id}`);
      const currentStreak = await this.calculateUserStreak(user.id, updatedRecord.plan_id);
      const prevStreak = await this.leaderboardService.getUserStreak(user.id) || 0;
      if (currentStreak !== prevStreak) {
        await this.leaderboardService.updateUserStreak(user.id, currentStreak);
      }
      if (data.cigarettes_smoked === 0) {
        await this.badgeAwardService.processStreakUpdate(user.id, currentStreak);
      }
      return updatedRecord as ProgressRecord;
    } catch (error) {
      this.logger.error(`Failed to update progress record: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update progress record.');
    }
  }

  async remove(id: string, user: UserType): Promise<ProgressRecord> {
    const record = await this.progressRecordRepository.findOne(id);
    if (!record) {
      throw new NotFoundException('Progress record not found.');
    }

    const plan = await this.cessationPlanRepository.findOne(record.plan_id);
    if (!plan) {
      throw new NotFoundException('Associated cessation plan not found.');
    }
    if (plan.user_id !== user.id) {
      throw new ForbiddenException('You can only delete progress records of your own plans.');
    }

    try {
      const removedRecord = await this.progressRecordRepository.remove(id);
      if (!removedRecord) throw new NotFoundException('Progress record not found or already deleted.');
      this.logger.log(`Progress record removed: ${removedRecord.id}`);
      return removedRecord as ProgressRecord;
    } catch (error) {
      this.logger.error(`Failed to remove progress record: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove progress record.');
    }
  }

  private async calculateUserStreak(userId: string, planId: string): Promise<number> {
    const records = await this.progressRecordRepository.findAll({ page: 1, limit: 1000, orderBy: 'record_date', sortOrder: 'desc' }, {planId});
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
}