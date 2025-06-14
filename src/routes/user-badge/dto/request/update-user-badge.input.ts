import { CreateUserBadgeInput } from './create-user-badge.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserBadgeInput extends PartialType(CreateUserBadgeInput) {
  @Field(() => Int)
  id: number;
}
