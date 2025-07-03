import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { CreateChatRoomInput } from './dto/request/create-chat-room.input';
import { CreateChatMessageInput } from './dto/request/create-chat-message.input';
import { ChatRepository } from './chat.repository';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Inject } from '@nestjs/common';
import { User } from 'src/shared/decorators/current-user.decorator';

@Resolver(() => ChatRoom)
@UseGuards(JwtAuthGuard)
export class ChatResolver {
  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Query(() => [ChatRoom])
  async chatRooms(@User() userId: string) {
    return this.chatRepository.getChatRooms(userId);
  }

  @Query(() => ChatRoom, { nullable: true })
  async chatRoom(
    @Args('id') id: string,
    @User() userId: string,
  ) {
    return this.chatRepository.getChatRoom(id, userId);
  }

  @Query(() => [ChatMessage])
  async chatMessages(
    @Args('roomId') roomId: string,
    @User() userId: string,
  ) {
    return this.chatRepository.getChatMessages(roomId, userId);
  }

  @Mutation(() => ChatRoom)
  async createChatRoom(
    @Args('input') input: CreateChatRoomInput,
    @User() userId: string,
  ) {
    return this.chatRepository.createChatRoom(userId, input);
  }

  @Mutation(() => ChatMessage)
  async sendMessage(
    @Args('input') input: CreateChatMessageInput,
    @User() userId: string,
  ) {
    const message = await this.chatRepository.createMessage(userId, input);
    
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

  @Mutation(() => Boolean)
  async markMessagesAsRead(
    @Args('roomId') roomId: string,
    @User() userId: string,
  ) {
    await this.chatRepository.markMessagesAsRead(roomId, userId);
    return true;
  }

  @Subscription(() => ChatMessage, {
    filter: (payload, variables) =>
      payload.chatRoomMessages.chat_room_id === variables.roomId,
  })
  chatRoomMessages(@Args('roomId') roomId: string) {
    return this.pubSub.asyncIterableIterator(`chatRoom:${roomId}`);
  }

  @Subscription(() => ChatMessage)
  messageCreated() {
    return this.pubSub.asyncIterableIterator('messageCreated');
  }
} 