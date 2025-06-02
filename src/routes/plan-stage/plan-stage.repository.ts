import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { CreatePlanStageType } from './schema/create-plan-stage.schema';
import { UpdatePlanStageType } from './schema/update-plan-stage.schema';

export interface PlanStageFilters {
  plan_id?: string;
  status?: string;
  template_stage_id?: string;
  user_id?: string;
  start_date?: Date;
  end_date?: Date;
}

@Injectable()
export class PlanStageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: PaginationParamsType, filters?: PlanStageFilters) {
    const { page, limit, search, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters, search);

    const [data, total] = await Promise.all([
      this.prisma.planStage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.planStage.count({ where }),
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
    return this.prisma.planStage.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });
  }

  async findByPlanId(planId: string) {
    return this.prisma.planStage.findMany({
      where: { plan_id: planId },
      include: this.getDefaultIncludes(),
      orderBy: { stage_order: 'asc' },
    });
  }

  async findActiveByPlanId(planId: string) {
    return this.prisma.planStage.findMany({
      where: {
        plan_id: planId,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
      include: this.getDefaultIncludes(),
      orderBy: { stage_order: 'asc' },
    });
  }

  async findByStageOrder(planId: string, stageOrder: number) {
    return this.prisma.planStage.findFirst({
      where: {
        plan_id: planId,
        stage_order: stageOrder,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async create(data: CreatePlanStageType) {
    return this.prisma.planStage.create({
      data: {
        plan_id: data.plan_id,
        template_stage_id: data.template_stage_id,
        stage_order: data.stage_order,
        title: data.title,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description,
        actions: data.actions,
        status: 'PENDING',
      },
      include: this.getDefaultIncludes(),
    });
  }

  async update(id: string, data: Omit<UpdatePlanStageType, 'id'>) {
    return this.prisma.planStage.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  async getStageStatistics(filters?: PlanStageFilters) {
    const where = this.buildWhereClause(filters);

    const [total, statusCounts] = await Promise.all([
      this.prisma.planStage.count({ where }),
      this.prisma.planStage.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map(item => [item.status, item._count._all])
    );

    const completed = statusMap.COMPLETED || 0;
    const skipped = statusMap.SKIPPED || 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total_stages: total,
      pending_stages: statusMap.PENDING || 0,
      active_stages: statusMap.ACTIVE || 0,
      completed_stages: completed,
      skipped_stages: skipped,
      completion_rate: parseFloat(completionRate.toFixed(2)),
    };
  }

  async createStagesFromTemplate(planId: string, templateId: string) {
    const templateStages = await this.prisma.planStageTemplate.findMany({
      where: {
        template_id: templateId,
        is_active: true,
      },
      orderBy: { stage_order: 'asc' },
    });

    const createStagesData = templateStages.map(templateStage => ({
      plan_id: planId,
      template_stage_id: templateStage.id,
      stage_order: templateStage.stage_order,
      title: templateStage.title,
      description: templateStage.description,
      actions: templateStage.recommended_actions,
      status: 'PENDING' as const,
    }));

    return this.prisma.planStage.createMany({
      data: createStagesData,
    });
  }

  async reorderStages(planId: string, stageOrders: { id: string; order: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Set all stage_orders to negative values to avoid conflicts
      const tempUpdatePromises = stageOrders.map(({ id }, index) =>
        tx.planStage.update({
          where: { id },
          data: { stage_order: -(index + 1) },
        })
      );

      await Promise.all(tempUpdatePromises);

      // Step 2: Update to final stage_order values
      const finalUpdatePromises = stageOrders.map(({ id, order }) =>
        tx.planStage.update({
          where: { id },
          data: { stage_order: order },
        })
      );

      await Promise.all(finalUpdatePromises);

      // Step 3: Return the reordered stages
      return tx.planStage.findMany({
        where: {
          plan_id: planId,
        },
        orderBy: { stage_order: 'asc' },
        include: {
          plan: {
            select: {
              id: true,
              user_id: true,
              status: true,
            },
          },
          template_stage: {
            select: {
              id: true,
              title: true,
              duration_days: true,
            },
          },
        },
      });
    });
  }

  private buildWhereClause(filters?: PlanStageFilters, search?: string): Prisma.PlanStageWhereInput {
    const where: Prisma.PlanStageWhereInput = {};

    if (filters?.plan_id) {
      where.plan_id = filters.plan_id;
    }

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.template_stage_id) {
      where.template_stage_id = filters.template_stage_id;
    }

    if (filters?.user_id) {
      where.plan = {
        user_id: filters.user_id,
      };
    }

    if (filters?.start_date) {
      where.start_date = { gte: filters.start_date };
    }

    if (filters?.end_date) {
      where.end_date = { lte: filters.end_date };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { actions: { contains: search, mode: 'insensitive' } },
        {
          plan: {
            reason: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    return where;
  }

  private getDefaultIncludes() {
    return {
      plan: {
        select: {
          id: true,
          user_id: true,
          reason: true,
          status: true,
          start_date: true,
          target_date: true,
          user: {
            select: {
              id: true,
              name: true,
              user_name: true,
            },
          },
        },
      },
      template_stage: {
        select: {
          id: true,
          title: true,
          duration_days: true,
          description: true,
          recommended_actions: true,
        },
      },
    };
  }
}