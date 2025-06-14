import { Field, ID, InputType } from '@nestjs/graphql'

@InputType()
export class UserBadgeFiltersInput {
  @Field(() => ID, { nullable: true })
  user_id?: string;

  @Field(() => ID, { nullable: true })
  badge_id?: string;
}