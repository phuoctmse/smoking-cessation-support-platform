import { CreateDemoGraphqlInput } from './create-demo-graphql.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateDemoGraphqlInput extends PartialType(CreateDemoGraphqlInput) {
  @Field(() => Int)
  id: number;
}
