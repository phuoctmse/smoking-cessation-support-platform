import { Field, Int, ObjectType } from '@nestjs/graphql'
import { PostComment } from '../../entities/post-comment.entity'

@ObjectType()
export class PaginatedPostCommentsResponse {
  @Field(() => [PostComment])
  data: PostComment[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}