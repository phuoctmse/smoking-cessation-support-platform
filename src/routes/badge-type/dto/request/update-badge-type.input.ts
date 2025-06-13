import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateBadgeTypeInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Boolean, { nullable: true })
  is_active?: boolean;
}