import { Field, ID, InputType } from '@nestjs/graphql'
import { IsOptional, IsUUID } from 'class-validator'

@InputType()
export class SharedPostFiltersInput {
  @Field(() => ID, { nullable: true, description: 'Filter by user ID (owner of the UserBadge)' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by badge ID' })
  @IsOptional()
  @IsUUID()
  badge_id?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  badge_type_id?: string;
}