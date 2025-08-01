import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom, UnreadCountEvent, ChatMessagesWithPlan } from './entities/chat-room.entity';
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
  // Track active subscriptions: roomId -> Set of userIds
  private activeSubscriptions = new Map<string, Set<string>>();

  constructor(
    private readonly chatRepository: ChatRepository,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) { }

  @Query(() => [ChatRoom])
  async getAllChatRoomsByUser(@CurrentUser() user: any) {
    return this.chatRepository.getChatRooms(user.id);
  }

  @Query(() => ChatMessagesWithPlan)
  async getChatMessagesByRoomId(
    @Args('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    const messages = await this.chatRepository.getChatMessages(roomId, user.id);
    
    const chatRoomWithPlan = await this.chatRepository.getChatRoom(roomId, user.id);
    
    if (!chatRoomWithPlan) {
      throw new Error('Chat room not found or you do not have permission to access this room');
    }

    return {
      messages,
      activeCessationPlan: (chatRoomWithPlan as any).activeCessationPlan,
      chatRoom: chatRoomWithPlan,
    };
  }

  @Query(() => Number, { description: 'Lấy tổng số tin nhắn chưa đọc từ tất cả chat rooms' })
  async getTotalUnreadMessagesCount(@CurrentUser() user: any): Promise<number> {
    return this.chatRepository.getTotalUnreadMessagesCount(user.id);
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

    const chatRoom = await this.chatRepository.getChatRoom(input.chat_room_id, user.id);
    if (!chatRoom) {
      throw new Error('Chat room not found or you do not have permission to access this room');
    }


    const senderId = user.id;
    if (chatRoom.creator_id !== senderId && chatRoom.receiver_id !== senderId) {
      throw new Error('You are not authorized to send messages in this chat room');
    }

    const message = await this.chatRepository.createMessage(user.id, input);

    await this.pubSub.publish(`chatRoom:${input.chat_room_id}`, {
      chatRoomMessages: message,
    });


    if (chatRoom) {
      const senderId = user.id;
      const receiverId = chatRoom.creator_id === senderId ? chatRoom.receiver_id : chatRoom.creator_id;
      

      const roomSubscribers = this.activeSubscriptions.get(input.chat_room_id);
      const isReceiverActive = roomSubscribers?.has(receiverId) || false;
      

      if (isReceiverActive) {
        await this.chatRepository.markMessagesAsRead(input.chat_room_id, receiverId);
      }


      const receiverUnreadAfter = await this.chatRepository.hasUnreadMessages(input.chat_room_id, receiverId);
      const receiverTotalAfter = await this.chatRepository.getTotalUnreadMessagesCount(receiverId);
      
      await this.pubSub.publish(`unreadCount:${receiverId}`, {
        unreadCountChanged: {
          roomId: input.chat_room_id,
          hasUnread: receiverUnreadAfter,
          totalCount: receiverTotalAfter,
        },
      });


      const senderHasUnread = await this.chatRepository.hasUnreadMessages(input.chat_room_id, senderId);
      const senderTotalUnread = await this.chatRepository.getTotalUnreadMessagesCount(senderId);
      
      await this.pubSub.publish(`unreadCount:${senderId}`, {
        unreadCountChanged: {
          roomId: input.chat_room_id,
          hasUnread: senderHasUnread,
          totalCount: senderTotalUnread,
        },
      });
    }

    return message;
  }

  @Subscription(() => ChatMessage, {
    filter: (payload, variables, context) => {
      const user = context.user;
      if (!user) return false;
      return payload.chatRoomMessages.chat_room_id === variables.roomId;
    },
    resolve: (payload, args, context) => {
      // Handle cleanup when subscription ends
      return payload.chatRoomMessages;
    }
  })
  async chatRoomMessages(
    @Args('roomId') roomId: string,
    @Context() context: any,
  ) {
    const user = context.user;
    if (!user) throw new Error('Unauthorized');
    
    // Handle both HTTP and WebSocket context user formats
    const userId = user.id || user.user_id;
    
    // Verify user has permission to access this chat room
    const chatRoom = await this.chatRepository.getChatRoom(roomId, userId);
    if (!chatRoom) {
      throw new Error('Chat room not found or you do not have permission to access this room');
    }

    // Verify user is participant (creator or receiver) of this chat room
    if (chatRoom.creator_id !== userId && chatRoom.receiver_id !== userId) {
      throw new Error('You are not authorized to subscribe to messages in this chat room');
    }

    console.log(`[TEMP DEBUG] Subscription validation passed for user ${userId} in room ${roomId}:`, {
      chatRoom: {
        id: chatRoom.id,
        creator_id: chatRoom.creator_id,
        receiver_id: chatRoom.receiver_id
      },
      subscriber: userId
    });
    
    // Track active subscription
    if (!this.activeSubscriptions.has(roomId)) {
      this.activeSubscriptions.set(roomId, new Set());
    }
    const roomSubscribers = this.activeSubscriptions.get(roomId);
    if (roomSubscribers) {
      roomSubscribers.add(userId);
    }
    
    // Auto mark existing messages as read when entering room (subscribing)
    await this.chatRepository.markMessagesAsRead(roomId, userId);
    
    // Publish unread status update after marking as read
    const hasUnread = await this.chatRepository.hasUnreadMessages(roomId, userId);
    const totalUnreadCount = await this.chatRepository.getTotalUnreadMessagesCount(userId);
    
    
    await this.pubSub.publish(`unreadCount:${userId}`, {
      unreadCountChanged: {
        roomId: roomId,
        hasUnread: hasUnread,
        totalCount: totalUnreadCount,
      },
    });
    
    // Create async iterator với cleanup khi unsubscribe
    const asyncIterator = this.pubSub.asyncIterableIterator(`chatRoom:${roomId}`);
    
    // Override return để cleanup khi subscription ends
    const originalReturn = asyncIterator.return?.bind(asyncIterator);
    asyncIterator.return = (value?: any) => {
      // Cleanup tracking
      const roomSubscribers = this.activeSubscriptions.get(roomId);
      if (roomSubscribers) {
        roomSubscribers.delete(userId);
        
        if (roomSubscribers.size === 0) {
          this.activeSubscriptions.delete(roomId);
        }
      }
      
      if (originalReturn) {
        return originalReturn(value);
      }
      return Promise.resolve({ value, done: true });
    };
    
    return asyncIterator;
  }

  @Subscription(() => UnreadCountEvent, {
    filter: (payload, variables, context) => {
      const user = context.user;
      const userId = user?.id || user?.user_id;
      return !!user;
    },
    resolve: (payload) => {
      return payload.unreadCountChanged;
    },
  })
  unreadCountChanged(@Context() context: any) {
    const user = context.user;
    const userId = user.id || user.user_id;
    
    if (!user) throw new Error('Unauthorized');
    
    return this.pubSub.asyncIterableIterator(`unreadCount:${userId}`);
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