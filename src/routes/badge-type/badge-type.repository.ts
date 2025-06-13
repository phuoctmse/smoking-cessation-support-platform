import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { CreateBadgeTypeType } from './schema/create-badge.schema'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { Prisma } from '@prisma/client'
import {BadgeTypeFiltersInput} from "./dto/request/badge-type-filter.input";
import {UpdateBadgeTypeType} from "./schema/update-badge.schema";

@Injectable()
export class BadgeTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBadgeTypeType) {
    return this.prisma.badgeType.create({
      data: {
        name: data.name,
      },
    });
  }

  async findAll(params: PaginationParamsType, filters?: BadgeTypeFiltersInput) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BadgeTypeWhereInput = {
      is_active: true,
    };

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.badgeType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
      }),
      this.prisma.badgeType.count({ where }),
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
    return this.prisma.badgeType.findUnique({
      where: {
        id,
        is_active: true,
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.badgeType.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        is_active: true,
      },
    });
  }

  async getStatistics() {
    const [
      totalBadgeTypes,
      activeBadgeTypes,
      badgeTypesWithBadges,
    ] = await Promise.all([
      this.prisma.badgeType.count(),
      this.prisma.badgeType.count({ where: { is_active: true } }),
      this.prisma.badgeType.findMany({
        where: { is_active: true },
        include: {
          _count: {
            select: {
              badges: {
                where: { is_active: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalBadgeTypes,
      activeBadgeTypes,
      inactiveBadgeTypes: totalBadgeTypes - activeBadgeTypes,
      badgeTypesWithBadges,
    };
  }

  async update(id: string, data: UpdateBadgeTypeType) {
    return this.prisma.badgeType.update({
      where: {
        id,
        is_active: true,
      },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.badgeType.update({
      where: {
        id,
        is_active: true,
      },
      data: { is_active: false },
    });
  }
}