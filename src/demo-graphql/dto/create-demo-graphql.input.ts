import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateDemoGraphqlInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  input: number;
}
