import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../user/entities/user.entity';

@ObjectType()
export class ChatMessage {
  @Field(() => String)
  id: string;

  @Field(() => String)
  session_id: string;

  @Field(() => ChatRoom)
  chat_room: ChatRoom;

  @Field(() => User)
  sender: User;

  @Field(() => String)
  content: string;

  @Field(() => Boolean)
  is_read: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
} 