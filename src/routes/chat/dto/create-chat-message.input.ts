import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateChatMessageInput {
  @Field()
  chat_room_id: string;

  @Field()
  content: string;
} 