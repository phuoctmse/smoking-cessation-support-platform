import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { CessationPlan } from '../../cessation-plan/entities/cessation-plan.entity';

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

@ObjectType()
export class ChatMessagesWithPlan {
  @Field(() => [ChatMessage], { description: 'Danh sách tin nhắn trong room' })
  messages: ChatMessage[];

  @Field(() => CessationPlan, { nullable: true, description: 'CessationPlan mà member đang sử dụng từ coach này (nếu có)' })
  activeCessationPlan?: CessationPlan;

  @Field(() => ChatRoom, { description: 'Thông tin chat room' })
  chatRoom: ChatRoom;
} 