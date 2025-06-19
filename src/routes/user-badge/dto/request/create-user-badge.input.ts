import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserBadgeInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
