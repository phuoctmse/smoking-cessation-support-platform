import { Field, ID, InputType } from '@nestjs/graphql'
import { IsOptional, IsUUID } from 'class-validator'

@InputType()
export class PostLikeFiltersInput {
  @Field(() => ID, { nullable: true, description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @Field(() => ID, { nullable: true, description: 'Filter by shared post ID' })
  @IsOptional()
  @IsUUID()
  shared_post_id?: string;
}