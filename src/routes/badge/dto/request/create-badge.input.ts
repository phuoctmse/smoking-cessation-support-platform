import { InputType, Int, Field, ID } from '@nestjs/graphql'

@InputType()
export class CreateBadgeInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  icon_url?: string;

  @Field(() => ID)
  badge_type_id: string;

  @Field(() => String, { nullable: true, description: 'JSON string containing badge requirements' })
  requirements?: string;

  @Field(() => Int, { defaultValue: 0 })
  sort_order: number;
}