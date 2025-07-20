import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql'
import { SharedPostService } from './shared-post.service';
import { SharedPost } from './entities/shared-post.entity';
import { CreateSharedPostInput } from './dto/request/create-shared-post.input';
import { UpdateSharedPostInput } from './dto/request/update-shared-post.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { PaginatedSharedPostsResponse } from './dto/response/paginated-shared-post.response'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { SharedPostFiltersInput } from './dto/request/shared-post-filter.input'

@Resolver(() => SharedPost)
export class SharedPostResolver {
  constructor(private readonly sharedPostService: SharedPostService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => SharedPost, { description: 'Create a new shared post from a UserBadge' })
  async createSharedPost(
    @Args('input') input: CreateSharedPostInput,
    @CurrentUser() currentUser: UserType,
  ): Promise<SharedPost> {
    return this.sharedPostService.create(input, currentUser);
  }

  @Query(() => SharedPost, { name: 'sharedPost', description: 'Get a single shared post by ID' })
  async getSharedPost(@Args('id', { type: () => ID }) id: string): Promise<SharedPost> {
    return this.sharedPostService.findOne(id);
  }

  @Query(() => PaginatedSharedPostsResponse, { name: 'sharedPosts', description: 'Get a list of shared posts (feed)' })
  async getSharedPosts(
    @Args('params', { type: () => PaginationParamsInput, nullable: true, defaultValue: { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'desc' } })
    params: PaginationParamsInput,
    @Args('filters', { type: () => SharedPostFiltersInput, nullable: true })
    filters?: SharedPostFiltersInput,
  ): Promise<PaginatedSharedPostsResponse> {
    return this.sharedPostService.findAll(params, filters);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => SharedPost, { description: 'Update the caption of a shared post' })
  async updateSharedPost(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSharedPostInput,
    @CurrentUser() currentUser: UserType,
  ): Promise<SharedPost> {
    return this.sharedPostService.update(id, input, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => SharedPost, { description: 'Delete a shared post' })
  async removeSharedPost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: UserType,
  ): Promise<SharedPost> {
    return this.sharedPostService.remove(id, currentUser);
  }
}