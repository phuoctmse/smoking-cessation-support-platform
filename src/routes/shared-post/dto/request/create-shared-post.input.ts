import { InputType, Field, ID } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

@InputType()
export class CreateSharedPostInput {
  @Field(() => ID, { description: 'ID of the UserBadge to be shared' })
  @IsNotEmpty()
  @IsUUID()
  user_badge_id: string;

  @Field(() => String, { nullable: true, description: 'Optional caption for the post' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
