import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@ObjectType()
export class ChatRoom {
  @Field(() => String)
  id: string;

  @Field(() => User)
  creator: User;

  @Field(() => User)
  receiver: User;

  @Field(() => Boolean)
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => [ChatMessage], { nullable: true })
  messages?: ChatMessage[];
} 