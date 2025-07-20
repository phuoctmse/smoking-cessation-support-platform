import { Field, InputType } from '@nestjs/graphql';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateChatMessageSchema = z.object({
  chat_room_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

@InputType()
export class CreateChatMessageInput extends createZodDto(CreateChatMessageSchema) {
  @Field(() => String)
  chat_room_id: string;

  @Field(() => String)
  content: string;
} 