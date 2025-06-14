import { Field, Int, ObjectType } from '@nestjs/graphql'
import { UserBadge } from '../../entities/user-badge.entity'

@ObjectType()
export class PaginatedUserBadgesResponse {
  @Field(() => [UserBadge])
  data: UserBadge[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}