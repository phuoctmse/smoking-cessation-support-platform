import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PostLikeRepository } from './post-like.repository'
import { SharedPostRepository } from '../shared-post/shared-post.repository'
import { UserType } from 'src/shared/models/share-user.model'
import { PostLike } from './entities/post-like.entity';
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { PaginatedPostLikesResponse } from './dto/response/paginated-post-like.response'

@Injectable()
export class PostLikeService {
  private readonly logger = new Logger(PostLikeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly postLikeRepository: PostLikeRepository,
    private readonly sharedPostRepository: SharedPostRepository,
  ) {}

  async likePost(sharedPostId: string, user: UserType): Promise<PostLike> {
    return this.prisma.$transaction(async (tx) => {
      const sharedPost = await tx.sharedPost.findUnique({
        where: { id: sharedPostId, is_deleted: false },
      });

      if (!sharedPost) {
        throw new NotFoundException('Shared post not found or has been deleted.');
      }

      const existingLike = await tx.postLike.findUnique({
        where: {
          shared_post_id_user_id: {
            shared_post_id: sharedPostId,
            user_id: user.id,
          },
        },
      });

      let resultLike: any;

      if (existingLike) {
        if (!existingLike.is_deleted) {
          throw new ConflictException('You have already liked this post.');
        }
        resultLike = await tx.postLike.update({
          where: { id: existingLike.id },
          data: { is_deleted: false, created_at: new Date() },
          include: { user: true, shared_post: true }
        });
        this.logger.log(`PostLike reactivated: ${resultLike.id} for post ${sharedPostId} by user ${user.id}`);
      } else {
        resultLike = await tx.postLike.create({
          data: {
            shared_post_id: sharedPostId,
            user_id: user.id,
            created_at: new Date(),
          },
          include: { user: true, shared_post: true }
        });
        this.logger.log(`PostLike created: ${resultLike.id} for post ${sharedPostId} by user ${user.id}`);
      }

      const activeLikesCount = await tx.postLike.count({
        where: { shared_post_id: sharedPostId, is_deleted: false },
      });
      await tx.sharedPost.update({
        where: { id: sharedPostId },
        data: { likes_count: activeLikesCount },
      });

      const transformedLike = this.transformToEntity(resultLike);
      if (transformedLike.shared_post) {
        transformedLike.shared_post.likes_count = activeLikesCount;
      }
      return transformedLike;
    });
  }

  async unlikePost(sharedPostId: string, user: UserType): Promise<PostLike> {
    return this.prisma.$transaction(async (tx) => {
      const sharedPost = await tx.sharedPost.findUnique({
        where: { id: sharedPostId },
      });

      if (!sharedPost) {
        throw new NotFoundException('Shared post not found.');
      }

      const existingLike = await tx.postLike.findUnique({
        where: {
          shared_post_id_user_id: {
            shared_post_id: sharedPostId,
            user_id: user.id,
          },
          is_deleted: false,
        },
      });

      if (!existingLike) {
        throw new NotFoundException('You have not liked this post or already unliked it.');
      }

      const unlikedResult = await tx.postLike.update({
        where: { id: existingLike.id },
        data: { is_deleted: true },
        include: { user: true, shared_post: true }
      });
      this.logger.log(`PostLike deleted (unliked): ${unlikedResult.id} for post ${sharedPostId} by user ${user.id}`);

      const activeLikesCount = await tx.postLike.count({
        where: { shared_post_id: sharedPostId, is_deleted: false },
      });
      await tx.sharedPost.update({
        where: { id: sharedPostId },
        data: { likes_count: activeLikesCount },
      });

      const transformedUnlike = this.transformToEntity(unlikedResult);
      if (transformedUnlike.shared_post) {
        transformedUnlike.shared_post.likes_count = activeLikesCount;
      }
      return transformedUnlike;
    });
  }

  async getLikesForPost(
    sharedPostId: string,
    params: PaginationParamsType,
  ): Promise<PaginatedPostLikesResponse> {
    const sharedPost = await this.sharedPostRepository.findOne(sharedPostId);
    if (!sharedPost) {
      throw new NotFoundException('Shared post not found.');
    }
    const result = await this.postLikeRepository.findAll(params, { shared_post_id: sharedPostId });
    return {
      ...result,
      data: result.data.map(like => this.transformToEntity(like)),
    };
  }

  async getPostsLikedByUser(
    userId: string,
    params: PaginationParamsType,
  ): Promise<PaginatedPostLikesResponse> {
    const result = await this.postLikeRepository.findAll(params, { user_id: userId });
    return {
      ...result,
      data: result.data.map(like => this.transformToEntity(like)),
    };
  }

  private transformToEntity(dbLike: any): PostLike {
    return {
      id: dbLike.id,
      shared_post_id: dbLike.shared_post_id,
      user_id: dbLike.user_id,
      is_deleted: dbLike.is_deleted,
      created_at: dbLike.created_at,
      user: dbLike.user ? {
        id: dbLike.user.id,
        name: dbLike.user.name,
        user_name: dbLike.user.user_name,
        avatar_url: dbLike.user.avatar_url,
        role: dbLike.user.role,
      } : null,
      shared_post: dbLike.shared_post ? {
        id: dbLike.shared_post.id,
        caption: dbLike.shared_post.caption,
      } : null,
    } as PostLike;
  }
}