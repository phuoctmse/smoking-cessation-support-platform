import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class BadgeAward {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
