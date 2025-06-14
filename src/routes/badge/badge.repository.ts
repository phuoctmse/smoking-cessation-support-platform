import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateBadgeType } from './schema/create-badge.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { BadgeFiltersInput } from './dto/request/badge-filter.input'
import { Prisma } from '@prisma/client'
import { UpdateBadgeType } from './schema/update-badge.schema'

@Injectable()
export class BadgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBadgeType) {
    return this.prisma.badge.create({
      data: {
        name: data.name,
        description: data.description,
        icon_url: data.icon_url,
        requirements: data.requirements,
        is_active: data.is_active,
        sort_order: data.sort_order,
        badge_type_id: data.badge_type_id,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findAll(params: PaginationParamsType, filters?: BadgeFiltersInput) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BadgeWhereInput = {
      is_active: true,
    };

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters?.badge_type_id) {
      where.badge_type_id = filters.badge_type_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.badge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.badge.count({ where }),
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
    return this.prisma.badge.findUnique({
      where: {
        id,
        is_active: true,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findByName(name: string) {
    return this.prisma.badge.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        is_active: true,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async getStatistics() {
    const [
      totalBadges,
      activeBadges,
      badgesByType,
    ] = await Promise.all([
      this.prisma.badge.count(),
      this.prisma.badge.count({ where: { is_active: true } }),
      this.prisma.badge.groupBy({
        by: ['badge_type_id'],
        _count: true,
        where: { is_active: true },
      }),
    ]);

    const badgeTypeInfo = await this.prisma.badgeType.findMany({
      where: {
        id: {
          in: badgesByType.map(item => item.badge_type_id),
        },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const enrichedBadgesByType = badgesByType.map(stat => {
      const typeInfo = badgeTypeInfo.find(bt => bt.id === stat.badge_type_id);
      return {
        badge_type_id: stat.badge_type_id,
        badge_type_name: typeInfo?.name || 'Unknown',
        count: stat._count,
      };
    });

    return {
      totalBadges,
      activeBadges,
      inactiveBadges: totalBadges - activeBadges,
      badgesByType: enrichedBadgesByType,
    };
  }

  async update(id: string, data: UpdateBadgeType) {
    const updateData: any = { ...data };
    if (data.badge_type_id) {
      updateData.badge_type_id = data.badge_type_id;
    }
    return this.prisma.badge.update({
      where: {
        id,
        is_active: true,
      },
      data: updateData,
      include: this.getDefaultIncludes(),
    });
  }

  async delete(id: string) {
    return this.prisma.badge.update({
      where: {
        id,
        is_active: true,
      },
      data: { is_active: false },
      include: this.getDefaultIncludes(),
    });
  }

  private getDefaultIncludes() {
    return {
      badge_type: {
        select: {
          id: true,
          name: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      },
    };
  }
}