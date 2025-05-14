import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DemoGraphql {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  input: number;
}
