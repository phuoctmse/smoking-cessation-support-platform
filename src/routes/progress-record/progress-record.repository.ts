import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { Prisma, ProgressRecord } from '@prisma/client'
import { CreateProgressRecordType } from './schema/create-progress-record.schema'
import { UpdateProgressRecordType } from './schema/update-progress-record.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { ProgressRecordFiltersInput } from './dto/request/progress-record-filters.input'

export interface MemberProfileMoneySavingsData {
  id: string;
  price_per_pack: number;
  cigarettes_per_pack: number;
  cigarettes_per_day: number;
}

@Injectable()
export class ProgressRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProgressRecordType): Promise<ProgressRecord> {
    return await this.prisma.progressRecord.create({
      data: {
        plan_id: data.plan_id,
        cigarettes_smoked: data.cigarettes_smoked ?? 0,
        health_score: data.health_score,
        notes: data.notes,
        record_date: data.record_date,
        is_deleted: false,
      },
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async findAll(
    params: PaginationParamsType,
    filters?: ProgressRecordFiltersInput,
    userId?: string
  ) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProgressRecordWhereInput = {
      is_deleted: false,
    };

    if (userId) {
      where.plan = {
        user_id: userId,
      };
    }

    if (filters?.planId) {
      where.plan_id = filters.planId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.record_date = {};
      if (filters.startDate) {
        where.record_date.gte = filters.startDate;
      }
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.record_date.lte = endOfDay;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.progressRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.progressRecord.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }

  async findOne(id: string): Promise<ProgressRecord | null> {
    return await this.prisma.progressRecord.findUnique({
      where: { id, is_deleted: false },
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async findOneWithAnyStatus(id: string): Promise<ProgressRecord | null> {
    return await this.prisma.progressRecord.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async findByPlanIdAndDate(planId: string, recordDate: Date): Promise<ProgressRecord | null> {
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.progressRecord.findFirst({
      where: {
        plan_id: planId,
        record_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_deleted: false,
      },
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async findAnyByPlanIdAndDate(planId: string, recordDate: Date): Promise<ProgressRecord | null> {
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.progressRecord.findFirst({
      where: {
        plan_id: planId,
        record_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async update(id: string, data: Omit<UpdateProgressRecordType, 'id' | 'plan_id'>): Promise<ProgressRecord | null> {
    return await this.prisma.progressRecord.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async remove(id: string): Promise<ProgressRecord | null> {
    return await this.prisma.progressRecord.update({
      where: { id, is_deleted: false },
      data: { is_deleted: true },
      include: this.getDefaultIncludes(),
    }) as unknown as ProgressRecord;
  }

  async getMemberProfileForMoneySavings(userId: string): Promise<MemberProfileMoneySavingsData | null> {
    try {
      return await this.prisma.memberProfile.findFirst({
        where: { user_id: userId },
        select: {
          id: true,
          price_per_pack: true,
          cigarettes_per_pack: true,
          cigarettes_per_day: true,
        },
      }) as MemberProfileMoneySavingsData | null;
    } catch (error) {
      return null;
    }
  }

  async getProgressRecordsForMoneySavings(
    userId: string,
    planId?: string
  ): Promise<Array<{ cigarettes_smoked: number; record_date: Date }>> {
    try {
      const whereClause: any = {
        plan: {
          user_id: userId,
        },
        is_deleted: false,
      };

      if (planId) {
        whereClause.plan_id = planId;
      }

      return await this.prisma.progressRecord.findMany({
        where: whereClause,
        select: {
          cigarettes_smoked: true,
          record_date: true,
        },
        orderBy: { record_date: 'desc' },
      });
    } catch (error) {
      return [];
    }
  }

  async validateUserProfileForMoneySavings(userId: string): Promise<boolean> {
    try {
      const profile = await this.prisma.memberProfile.findFirst({
        where: { user_id: userId },
        select: {
          price_per_pack: true,
          cigarettes_per_pack: true,
          cigarettes_per_day: true,
        },
      });

      return !!(
        profile?.price_per_pack &&
        profile?.cigarettes_per_pack &&
        profile?.cigarettes_per_day &&
        profile.price_per_pack > 0 &&
        profile.cigarettes_per_pack > 0 &&
        profile.cigarettes_per_day > 0
      );
    } catch (error) {
      return false;
    }
  }

  private getDefaultIncludes(): Prisma.ProgressRecordInclude {
    return {
      plan: {
        select: {
          id: true,
          user_id: true,
          status: true,
        },
      },
    };
  }
}