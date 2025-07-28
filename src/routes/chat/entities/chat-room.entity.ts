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

@ObjectType()
export class UnreadCountEvent {
  @Field(() => String, { description: 'ID của chat room' })
  roomId: string;

  @Field(() => Boolean, { description: 'Có tin nhắn chưa đọc trong room này hay không' })
  hasUnread: boolean;

  @Field(() => Number, { nullable: true, description: 'Tổng số tin nhắn chưa đọc từ tất cả rooms. Null khi chỉ update room cụ thể' })
  totalCount: number | null;
} 