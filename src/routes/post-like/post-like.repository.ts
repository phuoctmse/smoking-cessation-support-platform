import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { PostLikeFiltersInput } from './dto/request/post-like-filters.input'

@Injectable()
export class PostLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getDefaultIncludes(): Prisma.PostLikeInclude {
    return {
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
        },
      },
    };
  }

  async findUnique(sharedPostId: string, userId: string) {
    return this.prisma.postLike.findUnique({
      where: {
        shared_post_id_user_id: {
          shared_post_id: sharedPostId,
          user_id: userId,
        },
      },
      include: this.getDefaultIncludes(),
    });
  }

  async create(sharedPostId: string, userId: string) {
    const now = new Date();
    return this.prisma.postLike.create({
      data: {
        shared_post_id: sharedPostId,
        user_id: userId,
        created_at: now,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async reactivate(id: string) {
    const now = new Date();
    return this.prisma.postLike.update({
      where: { id },
      data: {
        is_deleted: false,
        created_at: now,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async delete(id: string) {
    return this.prisma.postLike.update({
      where: { id },
      data: {
        is_deleted: true,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async countActiveLikesForPost(sharedPostId: string): Promise<number> {
    return this.prisma.postLike.count({
      where: {
        shared_post_id: sharedPostId,
        is_deleted: false,
      },
    });
  }

  async findAll(params: PaginationParamsType, filters?: PostLikeFiltersInput) {
    const { page, limit, orderBy = 'created_at', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostLikeWhereInput = {
      is_deleted: false,
    };

    if (filters?.user_id) {
      where.user_id = filters.user_id;
    }
    if (filters?.shared_post_id) {
      where.shared_post_id = filters.shared_post_id;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.postLike.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.postLike.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }
}