import { Prisma } from '@prisma/client'
import { UpdateSharedPostInput } from './dto/request/update-shared-post.input'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { SharedPostFiltersInput } from './dto/request/shared-post-filter.input'
import { CreateSharedPostInput } from './dto/request/create-shared-post.input'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'

@Injectable()
export class SharedPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSharedPostInput, userId: string) {
    return this.prisma.sharedPost.create({
      data: {
        user_badge_id: data.user_badge_id,
        caption: data.caption,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findOne(id: string) {
    return this.prisma.sharedPost.findUnique({
      where: { id, is_deleted: false },
      include: this.getDefaultIncludes(),
    });
  }

  async findOneWithAnyStatus(id: string) { // Dùng để update/delete
    return this.prisma.sharedPost.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });
  }

  async findByUserBadgeId(userBadgeId: string) {
    return this.prisma.sharedPost.findUnique({
      where: { user_badge_id: userBadgeId, is_deleted: false },
      include: this.getDefaultIncludes(),
    });
  }

  async findActiveByUserBadgeId(userBadgeId: string) {
    return this.prisma.sharedPost.findUnique({
      where: { user_badge_id: userBadgeId, is_deleted: false },
      include: this.getDefaultIncludes(),
    });
  }

  async findAnyByUserBadgeId(userBadgeId: string) {
    return this.prisma.sharedPost.findUnique({
      where: { user_badge_id: userBadgeId },
      include: this.getDefaultIncludes(),
    });
  }

  async findAll(params: PaginationParamsType, filters?: SharedPostFiltersInput) {
    const { page, limit, orderBy = 'created_at', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SharedPostWhereInput = {
      is_deleted: false,
    };

    if (filters?.user_id) {
      where.user_badge = {
        user_id: filters.user_id,
        is_active: true,
      };
    }

    if (filters?.badge_id) {
      if (!where.user_badge) where.user_badge = { is_active: true };
      (where.user_badge as Prisma.UserBadgeWhereInput).badge_id = filters.badge_id;
      (where.user_badge as Prisma.UserBadgeWhereInput).badge = { is_active: true }; // Chỉ lấy badge active
    }

    if (filters?.badge_type_id) {
      if (!where.user_badge) where.user_badge = { is_active: true };
      if (!(where.user_badge as Prisma.UserBadgeWhereInput).badge) {
         (where.user_badge as Prisma.UserBadgeWhereInput).badge = { is_active: true };
      }
      ((where.user_badge as Prisma.UserBadgeWhereInput).badge as Prisma.BadgeWhereInput).badge_type_id = filters.badge_type_id;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sharedPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.sharedPost.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }

  async update(id: string, data: UpdateSharedPostInput) {
    return this.prisma.sharedPost.update({
      where: { id, is_deleted: false },
      data: {
        caption: data.caption,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async updateAndReactivate(id: string, caption?: string | null) {
    return this.prisma.sharedPost.update({
      where: { id },
      data: {
        caption: caption,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  async delete(id: string) {
    return this.prisma.sharedPost.update({
      where: { id, is_deleted: false },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  private getDefaultIncludes(): Prisma.SharedPostInclude {
    return {
      user_badge: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              user_name: true,
              avatar_url: true,
              role: true,
            },
          },
          badge: {
            include: {
              badge_type: true,
            },
          },
        },
      },
      // likes: true,
      // comments: true,
    };
  }
}