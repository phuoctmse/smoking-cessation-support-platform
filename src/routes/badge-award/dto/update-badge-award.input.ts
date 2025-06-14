import { CreateBadgeAwardInput } from './create-badge-award.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateBadgeAwardInput extends PartialType(CreateBadgeAwardInput) {
  @Field(() => Int)
  id: number;
}
