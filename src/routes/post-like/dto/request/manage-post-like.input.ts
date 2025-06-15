import { Field, ID, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsUUID } from 'class-validator'

@InputType()
export class ManagePostLikeInput {
  @Field(() => ID, { description: 'ID of the SharedPost to like/unlike' })
  @IsNotEmpty()
  @IsUUID()
  shared_post_id: string;
}