import { Field, Int, ObjectType } from '@nestjs/graphql'
import { SharedPost } from '../../entities/shared-post.entity'

@ObjectType()
export class PaginatedSharedPostsResponse {
  @Field(() => [SharedPost])
  data: SharedPost[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}