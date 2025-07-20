import { ObjectType, Field, ID } from '@nestjs/graphql'
import { User } from '../../user/entities/user.entity'

@ObjectType()
export class HealthScoreCriteria {
  @Field(() => ID)
  id: string;

  @Field()
  coach_id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => Boolean, { defaultValue: true })
  is_active: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => User, { nullable: true })
  coach?: User;
}

export type HealthScoreCriteriaType = HealthScoreCriteria;
