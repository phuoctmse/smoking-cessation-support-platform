import { Injectable, Logger } from '@nestjs/common'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UserRepository } from './user.repo'
import { UpdateUserProfileInput } from './dto/update-user-profile.input'
import { AuthService } from '../auth/auth.service'
import { SignupBodyType } from '../auth/schema/signup.schema'
import { AuthRepository } from '../auth/auth.repository'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepo: UserRepository, 
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService
  ) { }

  async createUser(createUserInput: CreateUserInput) {
    return await this.authRepository.signupByAdmin(createUserInput)
  }

  async findAll() {
    return await this.userRepo.findAll()
  }

  async findOne(id: string) {
    return await this.userRepo.findOne(id)
  }

  async updateProfile(id: string, updateUserInput: UpdateUserProfileInput) {
    return await this.userRepo.updateProfile(id, updateUserInput)
  }

  async updateByAdmin(id: string, updateUserInput: UpdateUserInput) {
    return await this.userRepo.updateByAdmin(id, updateUserInput)
  }

  async removeByAdmin(id: string) {
    const result = await this.userRepo.removeByAdmin(id)
    if (result) {
      return {
        message: 'User removed successfully'
      }
    }
    return {
      message: 'delete failed'
    }
  }

  async updateAllCoachStatistics(coachId: string): Promise<void> {
    try {
      const [successRate, totalClients, averageRating, totalSessions] = await Promise.all([
        this.calculateSuccessRate(coachId),
        this.calculateTotalClients(coachId),
        this.calculateAverageRating(coachId),
        this.calculateTotalSessions(coachId),
      ]);

      await this.prisma.coachProfile.updateMany({
        where: { user_id: coachId },
        data: {
          success_rate: successRate,
          total_clients: totalClients,
          average_rating: averageRating,
          total_sessions: totalSessions,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Updated statistics for coach ${coachId}: success_rate=${successRate}, total_clients=${totalClients}, average_rating=${averageRating}, total_sessions=${totalSessions}`);
    } catch (error) {
      this.logger.error(`Failed to update statistics for coach ${coachId}:`, error);
      throw error;
    }
  }

  private async calculateSuccessRate(coachId: string): Promise<number> {
    // Lấy các template của coach
    const templates = await this.prisma.cessationPlanTemplate.findMany({
      where: { coach_id: coachId, is_active: true },
      select: { id: true },
    });

    if (templates.length === 0) return 0;

    const templateIds = templates.map(t => t.id);

    // Đếm plans đã hoàn thành và bị hủy
    const [completedCount, cancelledCount] = await Promise.all([
      this.prisma.cessationPlan.count({
        where: {
          template_id: { in: templateIds },
          status: 'COMPLETED',
        },
      }),
      this.prisma.cessationPlan.count({
        where: {
          template_id: { in: templateIds },
          status: { in: ['CANCELLED', 'ABANDONED'] },
        },
      }),
    ]);

    const totalFinishedPlans = completedCount + cancelledCount;
    return totalFinishedPlans > 0 ? (completedCount / totalFinishedPlans) * 100 : 0;
  }

  private async calculateTotalClients(coachId: string): Promise<number> {
    const result = await this.prisma.cessationPlan.groupBy({
      by: ['user_id'],
      where: {
        template: {
          coach_id: coachId,
        },
      },
      _count: {
        user_id: true,
      },
    });

    return result.length; // Số lượng unique users
  }

  private async calculateAverageRating(coachId: string): Promise<number> {
    const templates = await this.prisma.cessationPlanTemplate.findMany({
      where: { coach_id: coachId, is_active: true },
      select: { average_rating: true, total_reviews: true },
    });

    if (templates.length === 0) return 0;

    let totalRating = 0;
    let totalReviews = 0;

    templates.forEach(template => {
      if (template.average_rating && template.total_reviews) {
        totalRating += template.average_rating * template.total_reviews;
        totalReviews += template.total_reviews;
      }
    });

    return totalReviews > 0 ? totalRating / totalReviews : 0;
  }

  private async calculateTotalSessions(coachId: string): Promise<number> {
    // Đếm số unique clients mà coach đã tương tác qua chat
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        OR: [
          { creator_id: coachId },
          { receiver_id: coachId },
        ],
        is_deleted: false,
      },
      select: {
        creator_id: true,
        receiver_id: true,
      },
    });

    // Tạo Set để lưu unique client IDs
    const uniqueClientIds = new Set<string>();
    
    chatRooms.forEach(room => {
      // Thêm ID của client (người không phải coach) vào Set
      if (room.creator_id !== coachId) {
        uniqueClientIds.add(room.creator_id);
      }
      if (room.receiver_id !== coachId) {
        uniqueClientIds.add(room.receiver_id);
      }
    });

    return uniqueClientIds.size; // Trả về số lượng unique clients
  }
 
  async onPlanCompleted(templateId: string): Promise<void> {
    const template = await this.prisma.cessationPlanTemplate.findUnique({
      where: { id: templateId },
      select: { coach_id: true },
    });

    if (template?.coach_id) {
      await this.updateAllCoachStatistics(template.coach_id);
    }
  }

  async onFeedbackSubmitted(templateId: string): Promise<void> {
    const template = await this.prisma.cessationPlanTemplate.findUnique({
      where: { id: templateId },
      select: { coach_id: true },
    });

    if (template?.coach_id) {
      await this.updateAllCoachStatistics(template.coach_id);
    }
  }

  async onNewClientStarted(templateId: string): Promise<void> {
    const template = await this.prisma.cessationPlanTemplate.findUnique({
      where: { id: templateId },
      select: { coach_id: true },
    });

    if (template?.coach_id) {
      await this.updateAllCoachStatistics(template.coach_id);
    }
  }
}
