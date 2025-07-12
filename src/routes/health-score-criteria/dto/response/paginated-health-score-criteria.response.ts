import { Field, Int, ObjectType } from '@nestjs/graphql'
import { HealthScoreCriteria } from '../../entities/health-score-criteria.entity'

@ObjectType()
export class PaginatedHealthScoreCriteria {
  @Field(() => [HealthScoreCriteria])
  data: HealthScoreCriteria[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasNext: boolean;
}