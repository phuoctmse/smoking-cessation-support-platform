import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateCessationPlanTemplateType } from './schema/create-cessation-plan-template.schema';
import { UpdateCessationPlanTemplateType } from './schema/update-cessation-plan-template.schema';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { Prisma } from '@prisma/client';

@Injectable()
export class CessationPlanTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: PaginationParamsType, filters?: {
    difficulty_level?: string;
    is_active?: boolean;
  }) {
    const { page, limit, search, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CessationPlanTemplateWhereInput = {
      is_active: filters?.is_active ?? true,
    };

    if (filters?.difficulty_level) {
      where.difficulty_level = filters.difficulty_level as any;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          description: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cessationPlanTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: {
          stages: {
            select: {
              id: true,
              stage_order: true,
              title: true,
              duration_days: true,
            },
            orderBy: { stage_order: 'asc' },
          },
          _count: {
            select: {
              plans: true,
              feedbacks: true,
            },
          },
        },
      }),
      this.prisma.cessationPlanTemplate.count({ where }),
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
    return this.prisma.cessationPlanTemplate.findUnique({
      where: { id, is_active: true },
      include: {
        stages: {
          select: {
            id: true,
            stage_order: true,
            title: true,
            duration_days: true,
            description: true,
            recommended_actions: true,
          },
          orderBy: { stage_order: 'asc' },
        },
        _count: {
          select: {
            plans: true,
            feedbacks: true,
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.cessationPlanTemplate.findFirst({
      where: {
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
        is_active: true,
      },
    });
  }

  async create(data: CreateCessationPlanTemplateType) {
    const createData: Prisma.CessationPlanTemplateCreateInput = {
      name: data.name,
      description: data.description,
      difficulty_level: data.difficulty_level,
      estimated_duration_days: data.estimated_duration_days,
      is_active: true,
      average_rating: 0,
      total_reviews: 0,
      success_rate: 0,
    };

    return this.prisma.cessationPlanTemplate.create({
      data: createData,
    });
  }

  async update(id: string, data: Omit<UpdateCessationPlanTemplateType, 'id'>) {
    const updateData: Prisma.CessationPlanTemplateUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.difficulty_level !== undefined) {
      updateData.difficulty_level = data.difficulty_level;
    }
    if (data.estimated_duration_days !== undefined) {
      updateData.estimated_duration_days = data.estimated_duration_days;
    }

    return this.prisma.cessationPlanTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    return this.prisma.cessationPlanTemplate.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async updateRating(id: string, newRating: number) {
    const currentTemplate = await this.prisma.cessationPlanTemplate.findUnique({
      where: { id },
      select: { average_rating: true, total_reviews: true },
    });

    if (!currentTemplate) return null;

    const currentAverage = currentTemplate.average_rating || 0;
    const currentTotal = currentTemplate.total_reviews;
    const newTotal = currentTotal + 1;
    const newAverage = ((currentAverage * currentTotal) + newRating) / newTotal;

    return this.prisma.cessationPlanTemplate.update({
      where: { id },
      data: {
        average_rating: newAverage,
        total_reviews: newTotal,
      },
    });
  }
}