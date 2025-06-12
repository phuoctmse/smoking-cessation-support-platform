import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { UpdateCessationPlanType } from './schema/update-cessation-plan.schema'
import { CreateCessationPlanType } from './schema/create-cessation-plan.schema'

export interface CessationPlanFilters {
  user_id?: string;
  status?: string;
  template_id?: string;
  start_date?: Date;
  target_date?: Date;
  is_custom?: boolean;
}

@Injectable()
export class CessationPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCessationPlanType & { user_id: string }) {
    return this.prisma.cessationPlan.create({
      data: {
        user_id: data.user_id,
        template_id: data.template_id,
        reason: data.reason,
        start_date: data.start_date,
        target_date: data.target_date,
        is_custom: data.is_custom,
        status: 'PLANNING',
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findAll(params: PaginationParamsType, filters?: CessationPlanFilters) {
    const { page, limit, search, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters, search);

    const [data, total] = await Promise.all([
      this.prisma.cessationPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.cessationPlan.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }

  async findOne(id: string) {
    return this.prisma.cessationPlan.findUnique({
      where: { id },
      include: {
        ...this.getDefaultIncludes(),
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.cessationPlan.findMany({
      where: { user_id: userId, is_deleted: false },
      include: this.getDefaultIncludes(),
      orderBy: { created_at: 'desc' },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.cessationPlan.findMany({
      where: {
        user_id: userId,
        is_deleted: false,
        status: { in: ['PLANNING', 'ACTIVE', 'PAUSED'] },
      },
      include: this.getDefaultIncludes(),
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUserAndTemplate(userId: string, templateId: string) {
    return this.prisma.cessationPlan.findMany({
      where: {
        user_id: userId,
        template_id: templateId,
        is_deleted: false,
      },
      select: {
        id: true,
        status: true,
        start_date: true,
        target_date: true,
        created_at: true,
      },
    });
  }

  async getStatistics(filters?: CessationPlanFilters) {
    const where = this.buildWhereClause(filters);

    const [total, statusCounts] = await Promise.all([
      this.prisma.cessationPlan.count({ where }),
      this.prisma.cessationPlan.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map(item => [item.status, item._count._all])
    );

    const completed = statusMap.COMPLETED || 0;
    const cancelled = statusMap.CANCELLED || 0;
    const successRate = total > 0 ? (completed / (completed + cancelled)) * 100 : 0;

    return {
      total_plans: total,
      active_plans: statusMap.ACTIVE || 0,
      planning_plans: statusMap.PLANNING || 0,
      paused_plans: statusMap.PAUSED || 0,
      completed_plans: completed,
      cancelled_plans: cancelled,
      success_rate: parseFloat(successRate.toFixed(2)),
    };
  }

  async update(id: string, data: Omit<UpdateCessationPlanType, 'id'>) {
    return this.prisma.cessationPlan.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  private buildWhereClause(filters?: CessationPlanFilters, search?: string): Prisma.CessationPlanWhereInput {
    const where: Prisma.CessationPlanWhereInput = {};

    if (filters?.user_id) {
      where.user_id = filters.user_id;
    }

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.template_id) {
      where.template_id = filters.template_id;
    }

    if (filters?.is_custom !== undefined) {
      where.is_custom = filters.is_custom;
    }

    if (filters?.start_date) {
      where.start_date = { gte: filters.start_date };
    }

    if (filters?.target_date) {
      where.target_date = { lte: filters.target_date };
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { user_name: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          template: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    return where;
  }

  private getDefaultIncludes() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
        },
      },
      template: {
        where: {is_active: true},
        select: {
          id: true,
          name: true,
          difficulty_level: true,
          estimated_duration_days: true,
        },
      },
      stages: {
        where: {is_deleted: false},
        orderBy: { stage_order: Prisma.SortOrder.asc },
        include: {
          template_stage: {
            select: {
              id: true,
              title: true,
              duration_days: true,
            },
          },
        },
      },
      _count: {
        select: {
          stages: true,
          progress_records: true,
        },
      },
    };
  }
}