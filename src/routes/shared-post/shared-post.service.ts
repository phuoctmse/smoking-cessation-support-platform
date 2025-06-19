import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CreateSharedPostInput } from './dto/request/create-shared-post.input';
import { UpdateSharedPostInput } from './dto/request/update-shared-post.input'
import { SharedPostRepository } from './shared-post.repository'
import { UserBadgeRepository } from '../user-badge/user-badge.repository'
import { SharedPost } from './entities/shared-post.entity'
import { UserType } from 'src/shared/models/share-user.model';
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { SharedPostFiltersInput } from './dto/request/shared-post-filter.input'
import { PaginatedSharedPostsResponse } from './dto/response/paginated-shared-post.response'
import { RoleName } from '../../shared/constants/role.constant'
import { Prisma } from '@prisma/client';

@Injectable()
export class SharedPostService {
  private readonly logger = new Logger(SharedPostService.name);

  constructor(
    private readonly sharedPostRepository: SharedPostRepository,
    private readonly userBadgeRepository: UserBadgeRepository,
  ) {}

  async create(input: CreateSharedPostInput, user: UserType): Promise<SharedPost> {
    const userBadge = await this.userBadgeRepository.findOne(input.user_badge_id);

    if (!userBadge) {
      throw new NotFoundException('UserBadge not found.');
    }
    if (!userBadge.is_active) {
      throw new BadRequestException('Cannot share an inactive UserBadge.');
    }
    if (userBadge.user_id !== user.id) {
      throw new ForbiddenException('You can only share your own UserBadges.');
    }

    const existingSharedPost = await this.sharedPostRepository.findAnyByUserBadgeId(input.user_badge_id);

    if (existingSharedPost) {
      if (!existingSharedPost.is_deleted) {
        throw new ConflictException('This UserBadge has already been shared and is active.');
      } else {
        this.logger.log(`Found soft-deleted SharedPost ${existingSharedPost.id} for UserBadge ${input.user_badge_id}. Reactivating.`);
        try {
          const reactivatedPost = await this.sharedPostRepository.updateAndReactivate(
            existingSharedPost.id,
            input.caption,
          );
          this.logger.log(`SharedPost reactivated and updated: ${reactivatedPost.id} by user ${user.id}`);
          return this.transformToEntity(reactivatedPost);
        } catch (error) {
          this.logger.error(`Failed to reactivate SharedPost for ID ${existingSharedPost.id}: ${error.message}`, error.stack);
          throw new BadRequestException('Failed to reactivate shared post.');
        }
      }
    } else {
      try {
        const sharedPost = await this.sharedPostRepository.create(input, user.id);
        this.logger.log(`SharedPost created: ${sharedPost.id} by user ${user.id}`);
        return this.transformToEntity(sharedPost);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const metaTarget = error.meta?.target;
          if (Array.isArray(metaTarget) && metaTarget.includes('user_badge_id')) {
            this.logger.error(`P2002 conflict (unique constraint on user_badge_id) during new SharedPost creation for UserBadge ${input.user_badge_id}`, error.stack);
            throw new ConflictException('This UserBadge might have been shared concurrently. Please try again.');
          } else if (typeof metaTarget === 'string' && metaTarget.includes('user_badge_id')) {
            this.logger.error(`P2002 conflict (unique constraint on user_badge_id as string target) during new SharedPost creation for UserBadge ${input.user_badge_id}`, error.stack);
            throw new ConflictException('This UserBadge might have been shared concurrently. Please try again.');
          }
        }
        this.logger.error(`Failed to create SharedPost: ${error.message}`, error.stack);
        throw new BadRequestException('Failed to create shared post.');
      }
    }
  }

  async findOne(id: string): Promise<SharedPost> {
    const sharedPost = await this.sharedPostRepository.findOne(id);
    if (!sharedPost) {
      throw new NotFoundException('Shared post not found.');
    }
    return this.transformToEntity(sharedPost);
  }

  async findAll(
    params: PaginationParamsType,
    filters?: SharedPostFiltersInput,
  ): Promise<PaginatedSharedPostsResponse> {
    const result = await this.sharedPostRepository.findAll(params, filters);
    return {
      ...result,
      data: result.data.map(post => this.transformToEntity(post)),
    };
  }

  async update(id: string, input: UpdateSharedPostInput, user: UserType): Promise<SharedPost> {
    const sharedPost = await this.sharedPostRepository.findOneWithAnyStatus(id);
    if (!sharedPost || sharedPost.is_deleted) {
      throw new NotFoundException('Shared post not found or has been deleted.');
    }

    if (sharedPost.user_badge.user_id !== user.id) {
      throw new ForbiddenException('You can only update your own shared posts.');
    }

    try {
      const updatedPost = await this.sharedPostRepository.update(id, input);
      if (!updatedPost) {
        throw new NotFoundException('Shared post not found during update.');
      }
      this.logger.log(`SharedPost updated: ${updatedPost.id} by user ${user.id}`);
      return this.transformToEntity(updatedPost);
    } catch (error) {
      this.logger.error(`Failed to update SharedPost ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update shared post.');
    }
  }

  async remove(id: string, user: UserType): Promise<SharedPost> {
    const sharedPost = await this.sharedPostRepository.findOneWithAnyStatus(id);
    if (!sharedPost || sharedPost.is_deleted) {
      throw new NotFoundException('Shared post not found or already deleted.');
    }

    const canDelete =
      user.role === RoleName.Admin ||
      user.role === RoleName.Coach ||
      sharedPost.user_badge.user_id === user.id;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this shared post.');
    }

    try {
      const deletedPost = await this.sharedPostRepository.delete(id);
      if (!deletedPost) {
        throw new NotFoundException('Shared post not found during delete.');
      }
      this.logger.log(`SharedPost deleted: ${deletedPost.id} by user ${user.id}`);
      return this.transformToEntity(deletedPost);
    } catch (error) {
      this.logger.error(`Failed to delete SharedPost ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete shared post.');
    }
  }

  private transformToEntity(dbPost: any): SharedPost {
    return {
      id: dbPost.id,
      user_badge_id: dbPost.user_badge_id,
      caption: dbPost.caption,
      likes_count: dbPost.likes_count,
      comments_count: dbPost.comments_count,
      is_deleted: dbPost.is_deleted,
      created_at: dbPost.created_at,
      updated_at: dbPost.updated_at,
      user_badge: {
        id: dbPost.user_badge.id,
        user_id: dbPost.user_badge.user_id,
        badge_id: dbPost.user_badge.badge_id,
        awarded_at: dbPost.user_badge.awarded_at,
        is_active: dbPost.user_badge.is_active,
        created_at: dbPost.user_badge.created_at,
        updated_at: dbPost.user_badge.updated_at,
        badge: {
          id: dbPost.user_badge.badge.id,
          name: dbPost.user_badge.badge.name,
          description: dbPost.user_badge.badge.description,
          icon_url: dbPost.user_badge.badge.icon_url,
          requirements: dbPost.user_badge.badge.requirements ? JSON.stringify(dbPost.user_badge.badge.requirements) : undefined,
          is_active: dbPost.user_badge.badge.is_active,
          sort_order: dbPost.user_badge.badge.sort_order,
          created_at: dbPost.user_badge.badge.created_at,
          updated_at: dbPost.user_badge.badge.updated_at,
          badge_type: dbPost.user_badge.badge.badge_type,
        },
        user: dbPost.user_badge.user,
      },
    };
  }
}