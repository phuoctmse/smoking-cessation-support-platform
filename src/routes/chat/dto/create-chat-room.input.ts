import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateChatRoomInput {
  @Field()
  receiver_id: string;
} 