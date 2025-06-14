import { Injectable } from '@nestjs/common'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UserBadgeFiltersInput } from './dto/request/user-badge-filter.input'
import { Prisma } from '@prisma/client'

@Injectable()
export class UserBadgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDefaultIncludes() {
    return {
      badge: {
        include: {
          badge_type: {
            select: {
              id: true,
              name: true,
              is_active: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
          role: true,
        },
      },
    };
  }

  async findUserBadges(userId: string, params: PaginationParamsType, filters?: UserBadgeFiltersInput) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserBadgeWhereInput = {
      user_id: userId,
      is_active: true,
      badge: {
        is_active: true,
      },
    };

    if (filters?.badge_id) {
      where.badge_id = filters.badge_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.userBadge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.userBadge.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }

  async findAll(params: PaginationParamsType, filters?: UserBadgeFiltersInput) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserBadgeWhereInput = {
      is_active: true,
      badge: {
        is_active: true,
      },
    };

    if (filters?.user_id) {
      where.user_id = filters.user_id;
    }

    if (filters?.badge_id) {
      where.badge_id = filters.badge_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.userBadge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.userBadge.count({ where }),
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
    return this.prisma.userBadge.findUnique({
      where: {
        id,
        is_active: true,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async getUserBadgeStats(userId: string) {
    const [
      totalBadges,
      badgesByTypeRaw,
      recentBadges,
    ] = await Promise.all([
      this.prisma.userBadge.count({
        where: {
          user_id: userId,
          is_active: true,
          badge: { is_active: true },
        },
      }),
      this.prisma.userBadge.groupBy({
        by: ['badge_id'],
        where: {
          user_id: userId,
          is_active: true,
          badge: { is_active: true },
        },
        _count: true,
      }),
      this.prisma.userBadge.findMany({
        where: {
          user_id: userId,
          is_active: true,
          badge: { is_active: true },
        },
        take: 5,
        orderBy: { awarded_at: 'desc' },
        include: this.getDefaultIncludes(),
      }),
    ]);

    const badgeIds = badgesByTypeRaw.map(item => item.badge_id);
    const badgeDetails = await this.prisma.badge.findMany({
      where: {
        id: { in: badgeIds },
        is_active: true,
      },
      include: {
        badge_type: {
          select: {
            id: true,
            name: true,
            is_active: true,
          },
        },
      },
    });

    const badgesByType = badgesByTypeRaw.map(stat => {
      const badgeInfo = badgeDetails.find(badge => badge.id === stat.badge_id);
      return {
        badge_id: stat.badge_id,
        badge_name: badgeInfo?.name || 'Unknown',
        badge_type: badgeInfo?.badge_type?.name || 'Unknown',
        count: stat._count,
      };
    });

    return {
      totalBadges,
      badgesByType,
      recentBadges,
    };
  }

  async awardBadge(userId: string, badgeId: string) {
    const existingUserBadge = await this.prisma.userBadge.findFirst({
      where: {
        user_id: userId,
        badge_id: badgeId,
      },
    });

    if (existingUserBadge) {
      return existingUserBadge;
    }

    return this.prisma.userBadge.create({
      data: {
        user_id: userId,
        badge_id: badgeId,
      },
      include: this.getDefaultIncludes(),
    });
  }
}