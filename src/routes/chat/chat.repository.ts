import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { CreateChatRoomInput } from './dto/request/create-chat-room.input'
import { CreateChatMessageInput } from './dto/request/create-chat-message.input'

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
    })
  }

  async getChatRooms(userId: string) {
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        OR: [{ creator_id: userId }, { receiver_id: userId }],
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
    })

    return chatRooms
  }

  async getChatRoom(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [{ creator_id: userId }, { receiver_id: userId }],
        is_deleted: false,
      },
      include: {
        creator: true,
        receiver: true,
      },
    });

    if (!room) return null;

    const activeCessationPlan = await this.getActiveCessationPlan(userId, room);
    
    return {
      ...room,
      activeCessationPlan,
    };
  }

  private async getActiveCessationPlan(userId: string, room: any) {
    let memberId: string | null = null;
    let coachId: string | null = null;

    const [creator, receiver] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: room.creator_id },
        select: { role: true }
      }),
      this.prisma.user.findUnique({
        where: { id: room.receiver_id },
        select: { role: true }
      })
    ]);

    if (creator?.role === 'MEMBER' && receiver?.role === 'COACH') {
      memberId = room.creator_id;
      coachId = room.receiver_id;
    } else if (creator?.role === 'COACH' && receiver?.role === 'MEMBER') {
      memberId = room.receiver_id;
      coachId = room.creator_id;
    } else {
      return null;
    }

    if (userId !== memberId && userId !== coachId) {
      return null;
    }

    const activePlan = await this.prisma.cessationPlan.findFirst({
      where: {
        user_id: memberId,
        status: 'ACTIVE',
        is_deleted: false,
        template: {
          coach_id: coachId,
          is_active: true,        
        },
      },
      include: {
        template: {
          include: {
            coach: true,
          },
        },
        stages: {
          where: { is_deleted: false },
          orderBy: { stage_order: 'asc' },
        },
        progress_records: {
          orderBy: { record_date: 'desc' },
          take: 5,
        },
      },
    });


    return activePlan;
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
    })
  }

  async getChatMessages(roomId: string, userId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        chat_room_id: roomId,
        chat_room: {
          OR: [{ creator_id: userId }, { receiver_id: userId }],
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
    })
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
    })
  }

  // Kiểm tra có tin nhắn chưa đọc hay không cho một user trong một chat room cụ thể
  async hasUnreadMessages(roomId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.chatMessage.count({
      where: {
        chat_room_id: roomId,
        sender_id: { not: userId }, // Chỉ đếm tin nhắn từ người khác
        is_read: false,
      },
    })
    
    return count > 0
  }

  // Lấy tổng số tin nhắn chưa đọc của user từ tất cả chat rooms
  async getTotalUnreadMessagesCount(userId: string): Promise<number> {
    const count = await this.prisma.chatMessage.count({
      where: {
        sender_id: { not: userId },
        is_read: false,
        chat_room: {
          OR: [{ creator_id: userId }, { receiver_id: userId }],
          is_deleted: false,
        },
      },
    })

    return count
  }
}
