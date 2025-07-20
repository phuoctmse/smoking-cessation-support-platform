import { Field, Int, ObjectType } from '@nestjs/graphql'
import { PostLike } from '../../entities/post-like.entity'

@ObjectType()
export class PaginatedPostLikesResponse {
  @Field(() => [PostLike])
  data: PostLike[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}