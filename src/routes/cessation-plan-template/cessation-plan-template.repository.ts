import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { CreateCessationPlanTemplateType } from './schema/create-cessation-plan-template.schema'
import { UpdateCessationPlanTemplateType } from './schema/update-cessation-plan-template.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { DifficultyLevel, Prisma } from '@prisma/client'
import { CessationPlanTemplateFiltersInput } from './dto/request/cessation-plan-template-filters.input'
import { TemplateUsageFiltersInput } from './dto/request/template-usage-filters.input'

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

    let orderByClause: Prisma.CessationPlanTemplateOrderByWithRelationInput[]

    if (orderBy === 'average_rating') {
      orderByClause = [
        { average_rating: 'desc' },
        { success_rate: 'desc' },
        { created_at: 'desc' },
      ]
    } else if (orderBy === 'success_rate') {
      orderByClause = [
        { success_rate: 'desc' },
        { average_rating: 'desc' },
        { created_at: 'desc' },
      ]
    } else if (orderBy === 'total_reviews') {
      orderByClause = [
        { total_reviews: 'desc' },
        { average_rating: 'desc' },
        { success_rate: 'desc' },
        { created_at: 'desc' },
      ]
    } else {
      if (!orderBy || orderBy === 'created_at') {
        orderByClause = [
          { created_at: sortOrder || 'desc' },
          { average_rating: 'desc' },
          { success_rate: 'desc' },
        ]
      } else {
        orderByClause = [
          { [orderBy]: sortOrder },
          { average_rating: 'desc' },
          { success_rate: 'desc' },
          { created_at: 'desc' },
        ]
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.cessationPlanTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
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
              max_cigarettes_per_day: true
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
            max_cigarettes_per_day: true
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

  async getTemplateUsageStats(
    templateId: string,
    params: PaginationParamsType,
    filters?: TemplateUsageFiltersInput
  ) {
    const { page, limit, search } = params
    const skip = (page - 1) * limit

    const where: Prisma.CessationPlanWhereInput = {
      template_id: templateId,
      is_deleted: false,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (search || filters?.search) {
      const searchTerm = search || filters?.search
      where.user = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { user_name: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }
    }

    const template = await this.prisma.cessationPlanTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, name: true }
    })

    if (!template) {
      throw new Error('Template not found')
    }

    const statusStats = await this.prisma.cessationPlan.groupBy({
      by: ['status'],
      where: {
        template_id: templateId,
        is_deleted: false,
      },
      _count: {
        id: true,
      },
    })

    const statusOrder = ['PLANNING', 'ACTIVE', 'PAUSED', 'ABANDONED', 'COMPLETED']
    const orderedStats = statusStats
      .map(stat => ({
        status: stat.status,
        count: stat._count.id,
      }))
      .sort((a, b) => {
        const indexA = statusOrder.indexOf(a.status)
        const indexB = statusOrder.indexOf(b.status)
        return indexA - indexB
      })

    const totalUsers = await this.prisma.cessationPlan.count({
      where: {
        template_id: templateId,
        is_deleted: false,
      },
    })

    const [users, totalUsersFiltered] = await Promise.all([
      this.prisma.cessationPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            status: 'asc'
          },
          { created_at: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              user_name: true,
              avatar_url: true,
            },
          },
          stages: {
            where: { is_deleted: false },
            select: {
              id: true,
              status: true,
              stage_order: true,
            },
            orderBy: { stage_order: 'asc' },
          },
        },
      }),
      this.prisma.cessationPlan.count({ where }),
    ])

    const sortedUsers = users.sort((a, b) => {
      const indexA = statusOrder.indexOf(a.status)
      const indexB = statusOrder.indexOf(b.status)
      if (indexA !== indexB) {
        return indexA - indexB
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const totalPages = Math.ceil(totalUsersFiltered / limit)

    return {
      template_id: template.id,
      template_name: template.name,
      total_users: totalUsers,
      stats_by_status: orderedStats,
      users: {
        data: sortedUsers,
        total: totalUsersFiltered,
        page,
        limit,
        hasNext: page < totalPages,
      },
    }
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
    if (data.success_rate !== undefined) {
      updateData.success_rate = data.success_rate;
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