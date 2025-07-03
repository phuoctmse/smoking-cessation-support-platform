import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateChatRoomInput } from './dto/request/create-chat-room.input';
import { CreateChatMessageInput } from './dto/request/create-chat-message.input';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createChatRoom(userId: string, input: CreateChatRoomInput) {
    return this.prisma.chatRoom.create({
      data: {
        creator: { connect: { id: userId } },
        receiver: { connect: { id: input.receiver_id } },
      },
      include: {
        creator: true,
        receiver: true,
        ChatMessage: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: { sender: true },
        },
      },
    });
  }

  async getChatRooms(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        OR: [
          { creator_id: userId },
          { receiver_id: userId },
        ],
        is_deleted: false,
      },
      include: {
        creator: true,
        receiver: true,
        ChatMessage: {
          take: 1,
          orderBy: { created_at: 'desc' },
          include: { sender: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getChatRoom(roomId: string, userId: string) {
    return this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { creator_id: userId },
          { receiver_id: userId },
        ],
        is_deleted: false,
      },
      include: {
        creator: true,
        receiver: true,
      },
    });
  }

  async createMessage(userId: string, input: CreateChatMessageInput) {
    return this.prisma.chatMessage.create({
      data: {
        sender: { connect: { id: userId } },
        chat_room: { connect: { id: input.chat_room_id } },
        content: input.content,
        session_id: userId, // Using userId as session_id for simplicity
      },
      include: {
        sender: true,
        chat_room: {
          include: {
            creator: true,
            receiver: true,
          },
        },
      },
    });
  }

  async getChatMessages(roomId: string, userId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        chat_room_id: roomId,
        chat_room: {
          OR: [
            { creator_id: userId },
            { receiver_id: userId },
          ],
          is_deleted: false,
        },
      },
      include: {
        sender: true,
        chat_room: {
          include: {
            creator: true,
            receiver: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async markMessagesAsRead(roomId: string, userId: string) {
    return this.prisma.chatMessage.updateMany({
      where: {
        chat_room_id: roomId,
        sender_id: { not: userId },
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }
} 