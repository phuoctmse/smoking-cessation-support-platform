import { ObjectType, Field, ID } from '@nestjs/graphql'

@ObjectType()
export class BadgeType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Boolean)
  is_active: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}
