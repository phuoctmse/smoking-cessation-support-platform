import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateBadgeAwardInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
