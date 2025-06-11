import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { Prisma, ProgressRecord } from '@prisma/client'
import { CreateProgressRecordType } from './schema/create-progress-record.schema'
import { UpdateProgressRecordType } from './schema/update-progress-record.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { ProgressRecordFiltersInput } from './dto/request/progress-record-filters.input'

@Injectable()
export class ProgressRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProgressRecordType): Promise<ProgressRecord> {
    return this.prisma.progressRecord.create({
      data: {
        plan_id: data.plan_id,
        cigarettes_smoked: data.cigarettes_smoked ?? 0,
        health_score: data.health_score,
        notes: data.notes,
        record_date: data.record_date,
        is_deleted: false,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findAll(params: PaginationParamsType, filters?: ProgressRecordFiltersInput) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProgressRecordWhereInput = {
      is_deleted: false,
    };

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
    return this.prisma.progressRecord.findUnique({
      where: { id, is_deleted: false },
      include: this.getDefaultIncludes(),
    });
  }

  async findByPlanIdAndDate(planId: string, recordDate: Date): Promise<ProgressRecord | null> {
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.progressRecord.findFirst({
      where: {
        plan_id: planId,
        record_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_deleted: false,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async update(id: string, data: Omit<UpdateProgressRecordType, 'id' | 'plan_id'>): Promise<ProgressRecord | null> {
    return this.prisma.progressRecord.update({
      where: { id, is_deleted: false },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  async remove(id: string): Promise<ProgressRecord | null> {
    return this.prisma.progressRecord.update({
      where: { id, is_deleted: false },
      data: { is_deleted: true },
      include: this.getDefaultIncludes(),
    });
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