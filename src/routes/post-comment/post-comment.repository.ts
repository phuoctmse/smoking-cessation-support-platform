import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreatePostCommentInput } from './dto/request/create-post-comment.input'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { UpdatePostCommentInput } from './dto/request/update-post-comment.input'

@Injectable()
export class PostCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePostCommentInput, userId: string) {
    return this.prisma.postComment.create({
      data: {
        shared_post_id: data.shared_post_id,
        user_id: userId,
        content: data.content,
        parent_comment_id: data.parent_comment_id,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findOne(id: string) {
    return this.prisma.postComment.findUnique({
      where: { id, is_deleted: false },
      include: this.getDefaultIncludes(),
    });
  }

  async findOneWithAnyStatus(id: string) {
    return this.prisma.postComment.findUnique({
      where: { id },
      include: this.getDefaultIncludes(),
    });
  }

  async findAllForPost(
    sharedPostId: string,
    params: PaginationParamsType,
  ) {
    const { page, limit, orderBy = 'created_at', sortOrder = 'asc' } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostCommentWhereInput = {
      shared_post_id: sharedPostId,
      is_deleted: false,
      parent_comment_id: null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.postComment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(0),
      }),
      this.prisma.postComment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }

  async findAllActiveDescendantIds(
    parentCommentId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    const prismaClient = tx || this.prisma;
    const allDescendantIds: string[] = [];
    let currentLevelIdsToSearch = [parentCommentId];

    while (currentLevelIdsToSearch.length > 0) {
      const children = await prismaClient.postComment.findMany({
        where: {
          parent_comment_id: { in: currentLevelIdsToSearch },
          is_deleted: false,
        },
        select: { id: true },
      });

      const foundChildIds = children.map(c => c.id);
      if (foundChildIds.length === 0) {
        break;
      }

      allDescendantIds.push(...foundChildIds);
      currentLevelIdsToSearch = foundChildIds;
    }
    return allDescendantIds;
  }

  async update(id: string, data: UpdatePostCommentInput) {
    return this.prisma.postComment.update({
      where: { id, is_deleted: false },
      data: {
        content: data.content,
        updated_at: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const prismaClient = tx || this.prisma;
    return prismaClient.postComment.update({
      where: { id, is_deleted: false },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  async deleteMany(ids: string[], tx?: Prisma.TransactionClient) {
    const prismaClient = tx || this.prisma;
    return prismaClient.postComment.updateMany({
      where: {
        id: { in: ids },
        is_deleted: false,
      },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });
  }

  async countActiveCommentsForPost(sharedPostId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const prismaClient = tx || this.prisma;
    return prismaClient.postComment.count({
      where: {
        shared_post_id: sharedPostId,
        is_deleted: false,
      },
    });
  }

  private getDefaultIncludes(depth = 0): Prisma.PostCommentInclude {
    const include: Prisma.PostCommentInclude = {
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
        },
      },
    };

    if (depth < 2) {
      include.replies = {
        where: { is_deleted: false },
        orderBy: { created_at: 'asc' },
        include: this.getReplyIncludes(depth + 1),
      };
    }
    return include;
  }

  private getReplyIncludes(depth = 0): Prisma.PostCommentInclude {
    const include: Prisma.PostCommentInclude = {
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
          avatar_url: true,
        },
      },
    };
    if (depth < 2) {
      include.replies = {
        where: { is_deleted: false },
        orderBy: { created_at: 'asc' },
        include: this.getReplyIncludes(depth + 1),
      };
    }
    return include;
  }
}