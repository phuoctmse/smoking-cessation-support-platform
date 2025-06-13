import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BadgeType } from '../../entities/badge-type.entity';

@ObjectType()
export class PaginatedBadgeTypesResponse {
  @Field(() => [BadgeType])
  data: BadgeType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}