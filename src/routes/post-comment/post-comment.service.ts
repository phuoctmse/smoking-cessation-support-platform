import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreatePostCommentInput } from './dto/request/create-post-comment.input';
import { UpdatePostCommentInput } from './dto/request/update-post-comment.input'
import { PostComment } from './entities/post-comment.entity'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { PaginatedPostCommentsResponse } from './dto/response/paginated-post-comment.response'
import { RoleName } from 'src/shared/constants/role.constant'
import { UserType } from 'src/shared/models/share-user.model';
import { PrismaService } from '../../shared/services/prisma.service'
import { PostCommentRepository } from './post-comment.repository'
import { SharedPostRepository } from '../shared-post/shared-post.repository'
import { Prisma } from '@prisma/client';

@Injectable()
export class PostCommentService {
  private readonly logger = new Logger(PostCommentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly postCommentRepository: PostCommentRepository,
    private readonly sharedPostRepository: SharedPostRepository,
  ) {}

  async createComment(input: CreatePostCommentInput, user: UserType): Promise<PostComment> {
    return this.prisma.$transaction(async (tx) => {
      const sharedPost = await tx.sharedPost.findUnique({
        where: { id: input.shared_post_id, is_deleted: false },
      });
      if (!sharedPost) {
        throw new NotFoundException('Shared post not found or has been deleted.');
      }

      if (input.parent_comment_id) {
        const parentComment = await tx.postComment.findUnique({
          where: { id: input.parent_comment_id, is_deleted: false },
        });
        if (!parentComment) {
          throw new NotFoundException('Parent comment not found or has been deleted.');
        }
        if (parentComment.shared_post_id !== input.shared_post_id) {
          throw new BadRequestException('Parent comment does not belong to the same shared post.');
        }
      }

      const newComment = await tx.postComment.create({
        data: {
          shared_post_id: input.shared_post_id,
          user_id: user.id,
          content: input.content,
          parent_comment_id: input.parent_comment_id,
        },
        include: {
          user: { select: { id: true, name: true, user_name: true, avatar_url: true } },
          // replies: true,
        }
      });
      this.logger.log(`PostComment created: ${newComment.id} by user ${user.id}`);

      const activeCommentsCount = await tx.postComment.count({
        where: { shared_post_id: input.shared_post_id, is_deleted: false },
      });
      await tx.sharedPost.update({
        where: { id: input.shared_post_id },
        data: { comments_count: activeCommentsCount },
      });

      return this.transformToEntity(newComment);
    });
  }

  async getCommentsForPost(
    sharedPostId: string,
    params: PaginationParamsType,
  ): Promise<PaginatedPostCommentsResponse> {
    const post = await this.sharedPostRepository.findOne(sharedPostId);
    if (!post) {
      throw new NotFoundException('Shared post not found.');
    }
    const result = await this.postCommentRepository.findAllForPost(sharedPostId, params);
    return {
      ...result,
      data: result.data.map(comment => this.transformToEntity(comment)),
    };
  }

  async findCommentById(id: string): Promise<PostComment | null> {
    const comment = await this.postCommentRepository.findOne(id);
    return comment ? this.transformToEntity(comment) : null;
  }

  async updateComment(commentId: string, input: UpdatePostCommentInput, user: UserType): Promise<PostComment> {
    const comment = await this.postCommentRepository.findOneWithAnyStatus(commentId);
    if (!comment || comment.is_deleted) {
      throw new NotFoundException('Comment not found or has been deleted.');
    }

    if (comment.user_id !== user.id) {
      throw new ForbiddenException('You can only update your own comments.');
    }

    const updatedComment = await this.postCommentRepository.update(commentId, input);
    this.logger.log(`PostComment updated: ${updatedComment.id} by user ${user.id}`);
    return this.transformToEntity(updatedComment);
  }

  async deleteComment(commentId: string, user: UserType): Promise<PostComment> {
    return this.prisma.$transaction(async (tx) => {
      const prismaTransactionClient = tx as unknown as Prisma.TransactionClient;

      const commentToDelete = await prismaTransactionClient.postComment.findUnique({
        where: { id: commentId },
        include: { user: true },
      });

      if (!commentToDelete) {
        throw new NotFoundException('Comment not found.');
      }
      if (commentToDelete.is_deleted) {
        throw new NotFoundException('Comment already deleted.');
      }

      const canDelete =
        user.role === RoleName.Admin ||
        user.role === RoleName.Coach ||
        commentToDelete.user_id === user.id;

      if (!canDelete) {
        throw new ForbiddenException('You do not have permission to delete this comment.');
      }

      const descendantIds = await this.postCommentRepository.findAllActiveDescendantIds(
        commentId,
        prismaTransactionClient,
      );

      const allCommentIdsToDelete = [commentId, ...descendantIds];

      if (allCommentIdsToDelete.length > 0) {
        await this.postCommentRepository.deleteMany(
          allCommentIdsToDelete,
          prismaTransactionClient,
        );
      }

      const activeCommentsCount = await this.postCommentRepository.countActiveCommentsForPost(
        commentToDelete.shared_post_id,
        prismaTransactionClient,
      );
      await prismaTransactionClient.sharedPost.update({
        where: { id: commentToDelete.shared_post_id },
        data: { comments_count: activeCommentsCount },
      });

      const finalDeletedCommentState = {
        ...commentToDelete,
        is_deleted: true,
        updated_at: new Date(),
      };

      return this.transformToEntity(finalDeletedCommentState);
    });
  }

  private transformToEntity(dbComment: any): PostComment {
    return {
      id: dbComment.id,
      shared_post_id: dbComment.shared_post_id,
      user_id: dbComment.user_id,
      parent_comment_id: dbComment.parent_comment_id,
      content: dbComment.content,
      is_deleted: dbComment.is_deleted,
      created_at: dbComment.created_at,
      updated_at: dbComment.updated_at,
      user: dbComment.user ? {
        id: dbComment.user.id,
        name: dbComment.user.name,
        user_name: dbComment.user.user_name,
        avatar_url: dbComment.user.avatar_url,
        role: dbComment.user.role,
      } : null,
      shared_post: dbComment.shared_post ? {
        id: dbComment.shared_post.id,
        caption: dbComment.shared_post.caption,
      } : null,
      parent_comment: dbComment.parent_comment ? this.transformToEntity(dbComment.parent_comment) : null,
      replies: dbComment.replies ? dbComment.replies.map(reply => this.transformToEntity(reply)) : [],
    } as PostComment;
  }
}