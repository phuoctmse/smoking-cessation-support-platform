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
import { User } from 'src/shared/decorators/current-user.decorator';

@Resolver(() => ChatRoom)
@UseGuards(JwtAuthGuard)
export class ChatResolver {
  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Query(() => [ChatRoom])
  async chatRooms(@User() user: any) {
    return this.chatRepository.getChatRooms(user.id);
  }

  @Query(() => ChatRoom, { nullable: true })
  async chatRoom(
    @Args('id') id: string,
    @User() user: any,
  ) {
    return this.chatRepository.getChatRoom(id, user.id);
  }

  @Query(() => [ChatMessage])
  async chatMessages(
    @Args('roomId') roomId: string,
    @User() user: any,
  ) {
    return this.chatRepository.getChatMessages(roomId, user.id);
  }

  @Mutation(() => ChatRoom)
  async createChatRoom(
    @Args('input') input: CreateChatRoomInput,
    @User() user: any,
  ) {
    return this.chatRepository.createChatRoom(user.id, input);
  }

  @Mutation(() => ChatMessage)
  async sendMessage(
    @Args('input') input: CreateChatMessageInput,
    @User() user: any,
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

  @Mutation(() => Boolean)
  async markMessagesAsRead(
    @Args('roomId') roomId: string,
    @User() user: any,
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

  @Subscription(() => ChatMessage, {
    filter: (payload, variables, context) => {
      const user = context.user;
      return !!user;
    },
  })
  messageCreated(@Context() context: any) {
    const user = context.user;
    if (!user) throw new Error('Unauthorized');
    return this.pubSub.asyncIterableIterator('messageCreated');
  }
} 