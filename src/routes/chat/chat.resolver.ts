import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { CreateChatRoomInput } from './dto/request/create-chat-room.input';
import { CreateChatMessageInput } from './dto/request/create-chat-message.input';
import { ChatRepository } from './chat.repository';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Inject } from '@nestjs/common';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UserType } from '../user/schema/user.schema';

@Resolver(() => ChatRoom)
@UseGuards(JwtAuthGuard)
export class ChatResolver {
  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) { }

  @Query(() => [ChatRoom])
  async getAllChatRoomsByUser(@CurrentUser() user: any) {
    return this.chatRepository.getChatRooms(user.id);
  }

  @Query(() => [ChatMessage])
  async getChatMessagesByRoomId(
    @Args('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatRepository.getChatMessages(roomId, user.id);
  }

  @Mutation(() => ChatRoom)
  async createChatRoom(
    @Args('input') input: CreateChatRoomInput,
    @CurrentUser() user: any,
  ) {
    return this.chatRepository.createChatRoom(user.id, input);
  }

  @Mutation(() => ChatMessage)
  async sendMessage(
    @Args('input') input: CreateChatMessageInput,
    @CurrentUser() user: any,
  ) {
    const message = await this.chatRepository.createMessage(user.id, input);

    // Publish to room-specific channel
    await this.pubSub.publish(`chatRoom:${input.chat_room_id}`, {
      chatRoomMessages: message,
    });

    // Publish to global messages channel
    await this.pubSub.publish('messageCreated', {
      messageCreated: message,
    });

    return message;
  }

  //Use when:
  // Khi người dùng mở một phòng chat
  // Khi người dùng đang active trong phòng chat và nhận tin nhắn mới
  // Khi người dùng scroll và đọc các tin nhắn cũ
  @Mutation(() => Boolean)
  async markMessagesAsRead(
    @Args('roomId') roomId: string,
    @CurrentUser() user: UserType,
  ) {
    await this.chatRepository.markMessagesAsRead(roomId, user.id);
    return true;
  }

  @Subscription(() => ChatMessage, {
    filter: (payload, variables, context) => {
      const user = context.user;
      if (!user) return false;
      return payload.chatRoomMessages.chat_room_id === variables.roomId;
    },
  })
  chatRoomMessages(
    @Args('roomId') roomId: string,
    @Context() context: any,
  ) {
    const user = context.user;
    if (!user) throw new Error('Unauthorized');
    return this.pubSub.asyncIterableIterator(`chatRoom:${roomId}`);
  }

  // Plan for feature admin to see all messages created
  // @Subscription(() => ChatMessage, {
  //   filter: (payload, variables, context) => {
  //     const user = context.user;
  //     return !!user;
  //   },
  // })
  // messageCreated(@Context() context: any) {
  //   const user = context.user;
  //   if (!user) throw new Error('Unauthorized');
  //   return this.pubSub.asyncIterableIterator('messageCreated');
  // }
} 