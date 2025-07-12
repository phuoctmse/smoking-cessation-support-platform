import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { CreateHealthScoreCriteriaType } from './dto/request/create-health-score-criteria.input'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { UpdateHealthScoreCriteriaType } from './dto/request/update-health-score-criteria.input'

export interface HealthScoreCriteriaFilters {
  coach_id?: string;
  is_active?: boolean;
  search?: string;
}

@Injectable()
export class HealthScoreCriteriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateHealthScoreCriteriaType & { coach_id: string }) {
    return this.prisma.healthScoreCriteria.create({
      data,
      include: this.getDefaultIncludes(),
    });
  }

  async findAll(
    params: PaginationParamsType,
    filters: HealthScoreCriteriaFilters = {}
  ) {
    const { page, limit, orderBy = 'created_at', sortOrder = 'desc' } = params;
    const { coach_id, is_active, search } = filters;

    const whereClause: any = {};

    if (coach_id) {
      whereClause.coach_id = coach_id;
    }

    if (typeof is_active === 'boolean') {
      whereClause.is_active = is_active;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.healthScoreCriteria.findMany({
        where: whereClause,
        include: this.getDefaultIncludes(),
        orderBy: { [orderBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.healthScoreCriteria.count({ where: whereClause }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: page * limit < total,
    };
  }

  async findOne(id: string) {
    return this.prisma.healthScoreCriteria.findUnique({
      where: {
        id,
        is_active: true
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findOneByCoachId(coachId: string) {
    return this.prisma.healthScoreCriteria.findFirst({
      where: {
        coach_id: coachId,
        is_active: true
      },
    });
  }

  async findByCoachId(coachId: string) {
    return this.prisma.healthScoreCriteria.findMany({
      where: {
        coach_id: coachId,
        is_active: true,
      },
      include: this.getDefaultIncludes(),
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: string, data: Omit<UpdateHealthScoreCriteriaType, 'id'>) {
    return this.prisma.healthScoreCriteria.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  async remove(id: string) {
    return this.prisma.healthScoreCriteria.update({
      where: { id },
      data: { is_active: false },
      include: this.getDefaultIncludes(),
    });
  }

  private getDefaultIncludes() {
    return {
      coach: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
          role: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      },
    };
  }
}