import { Field, InputType } from '@nestjs/graphql';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const CreateChatRoomSchema = z.object({
  receiver_id: z.string().uuid(),
});

@InputType()
export class CreateChatRoomInput extends createZodDto(CreateChatRoomSchema) {
  @Field(() => String)
  receiver_id: string;
} 