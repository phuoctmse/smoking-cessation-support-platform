import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { Prisma } from '@prisma/client'
import { CreatePlanStageTemplateType } from './schema/create-plan-stage-template.schema'
import { UpdatePlanStageTemplateType } from './schema/update-plan-stage-template.schema'

@Injectable()
export class PlanStageTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePlanStageTemplateType) {
    const createData: Prisma.PlanStageTemplateCreateInput = {
      title: data.title,
      description: data.description,
      stage_order: data.stage_order,
      duration_days: data.duration_days,
      recommended_actions: data.recommended_actions,
      max_cigarettes_per_day: data.max_cigarettes_per_day,
      is_active: true,
      template: {
        connect: { id: data.template_id },
      },
    };

    return this.prisma.planStageTemplate.create({
      data: createData,
      include: {
        template: {
          select: { id: true, name: true, difficulty_level: true },
        },
      },
    });
  }

  async findAll(params: PaginationParamsType, templateId: string) {
    const { page, limit, search, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PlanStageTemplateWhereInput = {
      template_id: templateId,
      is_active: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.planStageTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              difficulty_level: true,
              is_active: true,
            },
          },
        },
      }),
      this.prisma.planStageTemplate.count({ where }),
    ]);

    return { data, total, page, limit, hasNext: total > page * limit };
  }

  async findOne(id: string) {
    return this.prisma.planStageTemplate.findUnique({
      where: {
        id,
        is_active: true,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            difficulty_level: true,
            estimated_duration_days: true,
            is_active: true,
          },
        },
      },
    });
  }

  async getAllStageIdsByTemplate(templateId: string): Promise<string[]> {
    const stages = await this.prisma.planStageTemplate.findMany({
      where: {
        template_id: templateId,
        is_active: true,
      },
      select: {
        id: true,
      },
    });

    return stages.map(s => s.id);
  }

  async findByStageOrder(templateId: string, stageOrder: number) {
    return this.prisma.planStageTemplate.findFirst({
      where: {
        template_id: templateId,
        stage_order: stageOrder,
        is_active: true,
      },
    });
  }

  async update(id: string, data: Omit<UpdatePlanStageTemplateType, 'id'>) {
    const updateData: Prisma.PlanStageTemplateUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.stage_order !== undefined) updateData.stage_order = data.stage_order;
    if (data.duration_days !== undefined) updateData.duration_days = data.duration_days;
    if (data.recommended_actions !== undefined) updateData.recommended_actions = data.recommended_actions;
    if (data.max_cigarettes_per_day !== undefined) updateData.max_cigarettes_per_day = data.max_cigarettes_per_day;

    if (data.template_id !== undefined) {
      updateData.template = {
        connect: { id: data.template_id },
      };
    }

    return this.prisma.planStageTemplate.update({
      where: {
        id,
        is_active: true,
      },
      data: updateData,
      include: {
        template: {
          select: { id: true, name: true, difficulty_level: true },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.planStageTemplate.update({
      where: {
        id,
        is_active: true,
      },
      data: { is_active: false },
      include: {
        template: {
          select: { id: true, name: true, difficulty_level: true },
        },
      },
    });
  }

  async reorderStages(templateId: string, stageOrders: { id: string; order: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Set all stage_orders to negative values to avoid conflicts
      const tempUpdatePromises = stageOrders.map(({ id }, index) =>
        tx.planStageTemplate.update({
          where: { id },
          data: { stage_order: -(index + 1) }, // Use negative values temporarily
        })
      );

      await Promise.all(tempUpdatePromises);

      // Step 2: Update to final stage_order values
      const finalUpdatePromises = stageOrders.map(({ id, order }) =>
        tx.planStageTemplate.update({
          where: { id },
          data: { stage_order: order },
        })
      );

      await Promise.all(finalUpdatePromises);

      // Step 3: Return the reordered stages
      return tx.planStageTemplate.findMany({
        where: {
          template_id: templateId,
          is_active: true,
        },
        orderBy: { stage_order: 'asc' },
        include: {
          template: {
            select: { id: true, name: true, difficulty_level: true },
          },
        },
      });
    });
  }

  async sumDurationByTemplate(templateId: string): Promise<number> {
    const result = await this.prisma.planStageTemplate.aggregate({
      _sum: {
        duration_days: true,
      },
      where: {
        template_id: templateId,
        is_active: true,
      },
    });
    return result._sum.duration_days || 0;
  }
}