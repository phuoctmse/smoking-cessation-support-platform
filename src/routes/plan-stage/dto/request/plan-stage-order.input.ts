import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class PlanStageOrderInput {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  order: number;
}