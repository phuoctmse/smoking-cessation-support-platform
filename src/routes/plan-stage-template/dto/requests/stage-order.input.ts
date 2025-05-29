import { InputType, Field, Int } from '@nestjs/graphql'

@InputType()
export class StageOrderInput {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  order: number;
}