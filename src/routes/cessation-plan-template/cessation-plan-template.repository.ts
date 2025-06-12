import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { CreateCessationPlanTemplateType } from './schema/create-cessation-plan-template.schema'
import { UpdateCessationPlanTemplateType } from './schema/update-cessation-plan-template.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { DifficultyLevel, Prisma } from '@prisma/client'
import { CessationPlanTemplateFiltersInput } from './dto/request/cessation-plan-template-filters.input'

@Injectable()
export class CessationPlanTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCessationPlanTemplateType & { coach_id: string }) {
    const createData: Prisma.CessationPlanTemplateCreateInput = {
      name: data.name,
      description: data.description,
      difficulty_level: data.difficulty_level as DifficultyLevel,
      estimated_duration_days: data.estimated_duration_days,
      is_active: true,
      average_rating: 0,
      total_reviews: 0,
      success_rate: 0,
      coach: {
        connect: { id: data.coach_id },
      },
    };

    return this.prisma.cessationPlanTemplate.create({
      data: createData,
      include: {
        coach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(
    params: PaginationParamsType,
    filters?: CessationPlanTemplateFiltersInput,
  ) {
    const { page, limit, search, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CessationPlanTemplateWhereInput = {
      is_active: true,
    }

    if (filters?.difficultyLevel) {
      where.difficulty_level = filters.difficultyLevel
    }

    if (filters?.coachId) {
      where.coach_id = filters.coachId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.cessationPlanTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: {
          stages: {
            where: {is_active: true},
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
          coach: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            }
          }
        },
      }),
      this.prisma.cessationPlanTemplate.count({ where }),
    ])

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
        coach: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
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

  async update(id: string, data: Omit<UpdateCessationPlanTemplateType, 'id'>) {
    const updateData: Prisma.CessationPlanTemplateUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.difficulty_level !== undefined) {
      updateData.difficulty_level = data.difficulty_level as DifficultyLevel
    }
    if (data.estimated_duration_days !== undefined) {
      updateData.estimated_duration_days = data.estimated_duration_days;
    }

    return this.prisma.cessationPlanTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async setAverageRating(templateId: string, averageRating: number, totalReviews: number) {
    return this.prisma.cessationPlanTemplate.update({
      where: { id: templateId },
      data: {
        average_rating: parseFloat(averageRating.toFixed(2)),
        total_reviews: totalReviews,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.cessationPlanTemplate.update({
      where: { id },
      data: { is_active: false },
    });
  }
}