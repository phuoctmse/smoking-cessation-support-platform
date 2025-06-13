import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateBadgeTypeInput {
  @Field(() => String)
  name: string;
}