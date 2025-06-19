import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Badge } from '../../entities/badge.entity'

@ObjectType()
export class PaginatedBadgesResponse {
  @Field(() => [Badge])
  data: Badge[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}