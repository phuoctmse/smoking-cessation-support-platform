import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

export interface UserData {
  id: string;
  avatar_url: string | null;
  name?: string | null;
}

@Injectable()
export class LeaderboardRepository {
  private readonly logger = new Logger(LeaderboardRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findActiveUsersByIds(userIds: string[]): Promise<UserData[]> {
    if (userIds.length === 0) {
      return [];
    }

    try {
      return await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          avatar_url: true
        },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch users by IDs: ${error.message}`);
      return [];
    }
  }

  async findActiveUserById(userId: string): Promise<UserData | null> {
    if (!userId?.trim()) {
      return null;
    }

    try {
      return await this.prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          avatar_url: true
        },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId}: ${error.message}`);
      return null;
    }
  }

  async getTotalActiveUsersCount(): Promise<number> {
    try {
      return await this.prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to count active users: ${error.message}`);
      return 0;
    }
  }

  async findActiveUsersWithPagination(
    limit: number,
    offset: number
  ): Promise<{ users: UserData[]; total: number }> {
    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            avatar_url: true
          },
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' }
        }),
        this.getTotalActiveUsersCount()
      ]);

      return { users, total };
    } catch (error) {
      this.logger.error(`Failed to fetch paginated users: ${error.message}`);
      return { users: [], total: 0 };
    }
  }

  async isUserActiveById(userId: string): Promise<boolean> {
    if (!userId?.trim()) {
      return false;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE'
        },
        select: { id: true }
      });

      return !!user;
    } catch (error) {
      this.logger.error(`Failed to check user status for ${userId}: ${error.message}`);
      return false;
    }
  }

  async findActiveUserStatuses(userIds: string[]): Promise<Map<string, boolean>> {
    if (userIds.length === 0) {
      return new Map();
    }

    try {
      const activeUsers = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          status: 'ACTIVE'
        },
        select: { id: true }
      });

      const statusMap = new Map<string, boolean>();

      userIds.forEach(id => statusMap.set(id, false));
      activeUsers.forEach(user => statusMap.set(user.id, true));

      return statusMap;
    } catch (error) {
      this.logger.error(`Failed to batch check user statuses: ${error.message}`);
      return new Map();
    }
  }
}