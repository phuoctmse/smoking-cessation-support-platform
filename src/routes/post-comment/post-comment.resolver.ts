import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, ID } from '@nestjs/graphql'
import { PostCommentService } from './post-comment.service';
import { PostComment } from './entities/post-comment.entity';
import { CreatePostCommentInput } from './dto/request/create-post-comment.input';
import { UpdatePostCommentInput } from './dto/request/update-post-comment.input';
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema'
import { PaginatedPostCommentsResponse } from './dto/response/paginated-post-comment.response'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'

@Resolver(() => PostComment)
@UseGuards(JwtAuthGuard)
export class PostCommentResolver {
  constructor(
    private readonly postCommentService: PostCommentService,
  ) {}

  @Mutation(() => PostComment, { description: 'Create a new comment on a shared post.' })
  async createPostComment(
    @Args('input') input: CreatePostCommentInput,
    @CurrentUser() currentUser: UserType,
  ): Promise<PostComment> {
    return this.postCommentService.createComment(input, currentUser);
  }

  @Query(() => PaginatedPostCommentsResponse, { name: 'postComments', description: 'Get comments for a shared post.' })
  async getPostComments(
    @Args('sharedPostId', { type: () => ID }) sharedPostId: string,
    @Args('params', { type: () => PaginationParamsInput, nullable: true, defaultValue: { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'asc' } })
    params: PaginationParamsInput,
  ): Promise<PaginatedPostCommentsResponse> {
    return this.postCommentService.getCommentsForPost(sharedPostId, params);
  }

  @ResolveField('parent_comment', () => PostComment, { nullable: true })
  async getParentComment(@Parent() comment: PostComment): Promise<PostComment | null> {
    if (!comment.parent_comment_id) {
      return null;
    }
    return this.postCommentService.findCommentById(comment.parent_comment_id);
  }

  @ResolveField('replies', () => [PostComment], { nullable: 'itemsAndList' })
  getReplies(@Parent() comment: PostComment): PostComment[] {
    if (!comment.id) return [];
    if (comment.replies && comment.replies.length > 0) {
      return comment.replies;
    }
    return [];
  }

  @Mutation(() => PostComment, { description: 'Update an existing comment.' })
  async updatePostComment(
    @Args('commentId', { type: () => ID }) commentId: string,
    @Args('input') input: UpdatePostCommentInput,
    @CurrentUser() currentUser: UserType,
  ): Promise<PostComment> {
    return this.postCommentService.updateComment(commentId, input, currentUser);
  }

  @Mutation(() => PostComment, { description: 'Delete a comment.' })
  async deletePostComment(
    @Args('commentId', { type: () => ID }) commentId: string,
    @CurrentUser() currentUser: UserType,
  ): Promise<PostComment> {
    return this.postCommentService.deleteComment(commentId, currentUser);
  }
}
