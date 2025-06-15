import { InputType, Field, ID } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

@InputType()
export class CreatePostCommentInput {
  @Field(() => ID, { description: 'ID of the SharedPost to comment on' })
  @IsNotEmpty()
  @IsUUID()
  shared_post_id: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @Field(() => ID, { nullable: true, description: 'ID of the parent comment if this is a reply' })
  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;
}