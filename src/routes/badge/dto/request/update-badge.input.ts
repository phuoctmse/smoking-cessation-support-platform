import { InputType, Field, Int, ID } from '@nestjs/graphql'

@InputType()
export class UpdateBadgeInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  icon_url?: string;

  @Field(() => ID, { nullable: true })
  badge_type_id?: string;

  @Field(() => String, { nullable: true, description: 'JSON string containing badge requirements' })
  requirements?: string;

  @Field(() => Boolean, { nullable: true })
  is_active?: boolean;

  @Field(() => Int, { nullable: true })
  sort_order?: number;
}