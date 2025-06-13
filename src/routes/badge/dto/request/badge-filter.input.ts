import { Field, ID, InputType } from '@nestjs/graphql'

@InputType()
export class BadgeFiltersInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => ID, { nullable: true })
  badge_type_id?: string;
}