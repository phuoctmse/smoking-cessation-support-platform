import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { RedisServices } from '../../shared/services/redis.service'
import { LeaderboardStats } from './dto/response/leaderboard-stats.response'
import { PaginatedStreakLeaderboard } from './dto/response/paginated-streak-leaderboard.response'
import { StreakLeaderboardEntry } from './dto/response/streak-leaderboard-entry.response'
import { LeaderboardRepository, UserData } from './leaderboard.repository'

export const LEADERBOARD_KEYS = {
  MAIN_SCORE: 'leaderboard:main',
  STREAK: 'leaderboard:streak',
  STAGES_COMPLETED: 'leaderboard:stages',
  BADGES_EARNED: 'leaderboard:badges',
} as const;

type LeaderboardKey = typeof LEADERBOARD_KEYS[keyof typeof LEADERBOARD_KEYS];

interface GetStreakLeaderboardParams {
  limit: number;
  offset: number;
  currentUserId: string;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);
  private readonly MAX_LIMIT = 100;

  constructor(
    private readonly redisServices: RedisServices,
    private readonly leaderboardRepository: LeaderboardRepository,
  ) {}

  async getStreakLeaderboard(params: GetStreakLeaderboardParams): Promise<PaginatedStreakLeaderboard> {
    try {
      this.validatePaginationParams(params.limit, params.offset);
      const rawLeaderboard = await this.getTopStreaks(params.limit, params.offset);

      if (rawLeaderboard.length === 0) {
        return { data: [], total: 0 };
      }

      const enrichedData = await this.enrichLeaderboardWithUserData(rawLeaderboard, params.offset);
      const myRank = await this.getCurrentUserRank(params.currentUserId);
      const stats = await this.getStreakLeaderboardStats();

      return {
        data: enrichedData,
        total: stats.totalUsers,
        myRank
      };

    } catch (error) {
      this.logger.error(`Error fetching streak leaderboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCurrentUserRank(userId: string): Promise<StreakLeaderboardEntry | null> {
    try {
      if (!userId?.trim()) {
        return null;
      }

      const streakData = await this.getUserStreakWithRank(userId);

      if (!streakData) {
        return null;
      }

      const user = await this.leaderboardRepository.findActiveUserById(userId);

      if (!user) {
        return null;
      }

      return {
        rank: streakData.rank,
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatar_url,
        streak: streakData.streak,
      };

    } catch (error) {
      this.logger.error(`Error fetching user streak rank for ${userId}: ${error.message}`)
      return null;
    }
  }

  async getStreakLeaderboardStats(): Promise<LeaderboardStats> {
    try {
      const totalUsers = await this.getTotalUsers(LEADERBOARD_KEYS.STREAK);

      if (totalUsers === 0) {
        return this.getEmptyStats();
      }

      const topUsers = await this.getTopStreaks(1, 0);
      const topStreak = topUsers.length > 0 ? topUsers[0].score : 0;

      const sampleSize = Math.min(100, totalUsers);
      const topSample = await this.getTopStreaks(sampleSize, 0);
      const averageStreak = this.calculateAverageStreak(topSample);

      return {
        totalUsers,
        averageStreak: parseFloat(averageStreak.toFixed(2)),
        topStreak,
      };

    } catch (error) {
      this.logger.error(`Error calculating leaderboard stats: ${error.message}`);
      return this.getEmptyStats();
    }
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    if (!userId?.trim() || streak < 0) {
      this.logger.warn(`Invalid parameters for updateUserStreak: userId=${userId}, streak=${streak}`);
      return;
    }

    try {
      await this.updateScore(LEADERBOARD_KEYS.STREAK, userId, streak);
    } catch (error) {
      this.logger.error(`Failed to update streak for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getTopStreaks(limit: number, offset = 0): Promise<{ userId: string; score: number }[]> {
    return this.getTop(LEADERBOARD_KEYS.STREAK, limit, offset);
  }

  async getUserStreakRank(userId: string): Promise<number | null> {
    if (!userId?.trim()) {
      return null;
    }
    return this.getRank(LEADERBOARD_KEYS.STREAK, userId);
  }

  async getUserStreak(userId: string): Promise<number | null> {
    if (!userId?.trim()) {
      return null;
    }
    return this.getScore(LEADERBOARD_KEYS.STREAK, userId);
  }

  async getUserStreakWithRank(userId: string): Promise<{ streak: number; rank: number } | null> {
    if (!userId?.trim()) {
      return null;
    }

    try {
      const [streak, rank] = await Promise.all([
        this.getUserStreak(userId),
        this.getUserStreakRank(userId)
      ]);

      if (streak === null || rank === null) {
        return null;
      }

      return { streak, rank };
    } catch (error) {
      this.logger.error(`Error getting user streak with rank for ${userId}: ${error.message}`);
      return null;
    }
  }

  private validatePaginationParams(limit: number, offset: number): void {
    if (!Number.isInteger(limit) || limit <= 0 || limit > this.MAX_LIMIT) {
      throw new BadRequestException(`Limit must be between 1 and ${this.MAX_LIMIT}`);
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException('Offset must be non-negative integer');
    }
  }

  private async enrichLeaderboardWithUserData(
    rawLeaderboard: { userId: string; score: number }[],
    offset: number
  ): Promise<StreakLeaderboardEntry[]> {
    if (rawLeaderboard.length === 0) {
      return [];
    }

    const userIds = rawLeaderboard.map(entry => entry.userId);
    const users = await this.leaderboardRepository.findActiveUsersByIds(userIds);
    const userMap = this.createUserMap(users);

    return rawLeaderboard.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        rank: offset + index + 1,
        userId: entry.userId,
        name: user?.name || 'Unknown User',
        avatarUrl: user?.avatar_url || null,
        streak: entry.score,
      };
    });
  }

  private createUserMap(users: UserData[]): Map<string, UserData> {
    return new Map(users.map(u => [u.id, u]));
  }

  private calculateAverageStreak(streakData: { userId: string; score: number }[]): number {
    if (streakData.length === 0) {
      return 0;
    }

    const totalStreak = streakData.reduce((sum, user) => sum + user.score, 0);
    return totalStreak / streakData.length;
  }

  private getEmptyStats(): LeaderboardStats {
    return {
      totalUsers: 0,
      averageStreak: 0,
      topStreak: 0,
    };
  }

  private async updateScore(key: LeaderboardKey, userId: string, score: number): Promise<void> {
    try {
      const client = this.redisServices.getClient();
      await client.zAdd(key, { score, value: userId });
    } catch (error) {
      this.logger.error(`Redis zAdd failed for ${key}: ${error.message}`);
      throw error;
    }
  }

  private async getTop(key: LeaderboardKey, limit: number, offset = 0): Promise<{ userId: string; score: number }[]> {
    try {
      const client = this.redisServices.getClient();
      const start = offset;
      const end = offset + limit - 1;

      const results = await client.zRangeWithScores(key, start, end, { REV: true });

      return results.map(result => ({
        userId: result.value,
        score: typeof result.score === 'number' ? result.score : 0
      }));

    } catch (error) {
      this.logger.error(`Redis zRangeWithScores failed for ${key}: ${error.message}`);
      return [];
    }
  }

  private async getRank(key: LeaderboardKey, userId: string): Promise<number | null> {
    try {
      const client = this.redisServices.getClient();
      const rank = await client.zRevRank(key, userId);
      return typeof rank === 'number' ? rank + 1 : null;
    } catch (error) {
      this.logger.error(`Redis zRevRank failed for ${key}: ${error.message}`);
      return null;
    }
  }

  private async getScore(key: LeaderboardKey, userId: string): Promise<number | null> {
    try {
      const client = this.redisServices.getClient();
      const score = await client.zScore(key, userId);
      return typeof score === 'number' ? score : null;
    } catch (error) {
      this.logger.error(`Redis zScore failed for ${key}: ${error.message}`);
      return null;
    }
  }

  private async getTotalUsers(key: LeaderboardKey): Promise<number> {
    try {
      const client = this.redisServices.getClient();
      const count = await client.zCard(key);
      return typeof count === 'number' ? count : 0;
    } catch (error) {
      this.logger.error(`Redis zCard failed for ${key}: ${error.message}`);
      return 0;
    }
  }
}