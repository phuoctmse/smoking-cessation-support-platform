import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql'
import { PostLikeService } from './post-like.service';
import { PostLike } from './entities/post-like.entity'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { ManagePostLikeInput } from './dto/request/manage-post-like.input'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { PaginatedPostLikesResponse } from './dto/response/paginated-post-like.response'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'

@Resolver(() => PostLike)
@UseGuards(JwtAuthGuard)
export class PostLikeResolver {
  constructor(private readonly postLikeService: PostLikeService) {}

  @Mutation(() => PostLike, { description: 'Like a shared post.' })
  async likeSharedPost(
    @Args('input') input: ManagePostLikeInput,
    @CurrentUser() currentUser: UserType,
  ): Promise<PostLike> {
    return this.postLikeService.likePost(input.shared_post_id, currentUser);
  }

  @Mutation(() => PostLike, { description: 'Unlike a shared post.' })
  async unlikeSharedPost(
    @Args('input') input: ManagePostLikeInput,
    @CurrentUser() currentUser: UserType,
  ): Promise<PostLike> {
    return this.postLikeService.unlikePost(input.shared_post_id, currentUser);
  }

  @Query(() => PaginatedPostLikesResponse, { name: 'postLikes', description: 'Get users who liked a specific post.' })
  async getLikesForPost(
    @Args('sharedPostId', { type: () => ID }) sharedPostId: string,
    @Args('params', { type: () => PaginationParamsInput, nullable: true, defaultValue: { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'desc' } })
    params: PaginationParamsInput,
  ): Promise<PaginatedPostLikesResponse> {
    return this.postLikeService.getLikesForPost(sharedPostId, params);
  }

  @Query(() => PaginatedPostLikesResponse, { name: 'myLikedPosts', description: 'Get posts liked by the current user.' })
  async getMyLikedPosts(
    @CurrentUser() currentUser: UserType,
    @Args('params', { type: () => PaginationParamsInput, nullable: true, defaultValue: { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'desc' } })
    params: PaginationParamsInput,
  ): Promise<PaginatedPostLikesResponse> {
    return this.postLikeService.getPostsLikedByUser(currentUser.id, params);
  }
}