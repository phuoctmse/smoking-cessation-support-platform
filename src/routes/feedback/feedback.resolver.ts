import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql'
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackInput } from './dto/request/create-feedback.input';
import { UpdateFeedbackInput } from './dto/request/update-feedback.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { User } from '../../shared/decorators/current-user.decorator'
import { UserType } from '../user/schema/user.schema';
import { PaginatedFeedbacksResponse } from './dto/response/paginated-feedbacks.response'
import { PaginationParamsInput } from '../../shared/models/dto/request/pagination-params.input'
import { FeedbackFiltersInput } from './dto/request/feedback-filters.input'

@Resolver(() => Feedback)
@UseGuards(JwtAuthGuard)
export class FeedbackResolver {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Mutation(() => Feedback)
  async createFeedback(
    @Args('input') input: CreateFeedbackInput,
    @User() user: UserType,
  ): Promise<Feedback> {
    return this.feedbackService.create(input, user);
  }

  @Query(() => Feedback, { nullable: true })
  async feedback(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Feedback | null> {
    return this.feedbackService.findOne(id);
  }

  @Query(() => PaginatedFeedbacksResponse)
  async feedbacks(
    @Args('params', { nullable: true, type: () => PaginationParamsInput,
      defaultValue: { page: 1, limit: 10, orderBy: 'created_at', sortOrder: 'desc' }
    }) params: PaginationParamsInput,
    @Args('filters', { nullable: true, type: () => FeedbackFiltersInput })
    filters: FeedbackFiltersInput,
    @User() user: UserType,
  ) {
    return this.feedbackService.findAll(params, filters, user);
  }

  @Mutation(() => Feedback)
  async updateFeedback(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeedbackInput,
    @User() user: UserType,
  ): Promise<Feedback> {
    return this.feedbackService.update(id, input, user);
  }

  @Mutation(() => Feedback)
  async removeFeedback(
    @Args('id', { type: () => ID }) id: string,
    @User() user: UserType,
  ): Promise<Feedback> {
    return this.feedbackService.remove(id, user);
  }
}