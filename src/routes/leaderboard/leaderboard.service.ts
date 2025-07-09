import { Injectable, Logger } from '@nestjs/common'
import { RedisServices } from '../../shared/services/redis.service'

export const LEADERBOARD_KEYS = {
  MAIN_SCORE: 'leaderboard:main',
  STREAK: 'leaderboard:streak',
  // STAGES_COMPLETED: 'leaderboard:stages',
  // BADGES_EARNED: 'leaderboard:badges',
} as const;

type LeaderboardKey = typeof LEADERBOARD_KEYS[keyof typeof LEADERBOARD_KEYS];

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly redisServices: RedisServices) {}

  private async updateScore(key: LeaderboardKey, userId: string, score: number): Promise<void> {
    const startTime = Date.now();

    try {
      await this.redisServices.getClient().zAdd(key, [{ score, value: userId }]);

      const duration = Date.now() - startTime;
      this.logger.log(`Updated ${key} for user ${userId}: ${score} (${duration}ms)`);

      // Log milestone achievements
      if (key === LEADERBOARD_KEYS.STREAK && score > 0 && score % 7 === 0) {
        this.logger.log(`🎉 User ${userId} reached ${score}-day streak milestone!`);
      }
    } catch (error) {
      this.logger.error(`Failed to update ${key} for user ${userId}:`, error);
      throw error;
    }
  }

  private async getTop(key: LeaderboardKey, limit: number, offset = 0): Promise<{ userId: string; score: number }[]> {
    const result = await this.redisServices.getClient().zRangeWithScores(
      key,
      offset,
      offset + limit - 1,
      { REV: true }
    );
    return result.map((entry) => ({
      userId: entry.value,
      score: entry.score,
    }));
  }

  private async getRank(key: LeaderboardKey, userId: string): Promise<number | null> {
    const rank = await this.redisServices.getClient().zRevRank(key, userId);
    return typeof rank === 'number' ? rank + 1 : null;
  }

  private async getScore(key: LeaderboardKey, userId: string): Promise<number | null> {
    const score = await this.redisServices.getClient().zScore(key, userId);
    return score !== null ? score : null;
  }

  private async getTotalUsers(key: LeaderboardKey): Promise<number> {
    return this.redisServices.getClient().zCard(key);
  }

  // --- API công khai cho Streak Leaderboard ---
  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await this.updateScore(LEADERBOARD_KEYS.STREAK, userId, streak);
  }

  async getTopStreaks(limit: number, offset = 0): Promise<{ userId: string; score: number }[]> {
    return this.getTop(LEADERBOARD_KEYS.STREAK, limit, offset);
  }

  async getUserStreakRank(userId: string): Promise<number | null> {
    return this.getRank(LEADERBOARD_KEYS.STREAK, userId);
  }

  async getUserStreak(userId: string): Promise<number | null> {
    return this.getScore(LEADERBOARD_KEYS.STREAK, userId);
  }

  async getStreakLeaderboardStats(): Promise<{
    totalUsers: number;
    averageStreak: number;
    topStreak: number;
  }> {
    const key = LEADERBOARD_KEYS.STREAK;
    const client = this.redisServices.getClient();

    const [totalUsers, topResult] = await Promise.all([
      this.getTotalUsers(key),
      client.zRangeWithScores(key, 0, 0, { REV: true })
    ]);

    const topStreak = topResult.length > 0 ? topResult[0].score : 0;

    let averageStreak = 0;
    if (totalUsers > 0) {
      const allScores = await client.zRangeWithScores(key, 0, -1);
      const sumScores = allScores.reduce((sum, entry) => sum + entry.score, 0);
      averageStreak = sumScores / totalUsers;
    }

    return {
      totalUsers,
      averageStreak: Math.round(averageStreak * 100) / 100,
      topStreak
    };
  }

  // --- API công khai cho Main Score Leaderboard---
  // async updateUserMainScore(userId: string, score: number): Promise<void> {
  //   await this.updateScore(LEADERBOARD_KEYS.MAIN_SCORE, userId, score);
  // }

  // async getTopMainScores(limit: number, offset = 0): Promise<{ userId: string; score: number }[]> {
  //   return this.getTop(LEADERBOARD_KEYS.MAIN_SCORE, limit, offset);
  // }

  // async getUserMainScoreRank(userId: string): Promise<number | null> {
  //   return this.getRank(LEADERBOARD_KEYS.MAIN_SCORE, userId);
  // }

  // async getUserMainScore(userId: string): Promise<number | null> {
  //   return this.getScore(LEADERBOARD_KEYS.MAIN_SCORE, userId);
  // }

  // --- Batch operations ---
  async batchUpdateStreaks(updates: { userId: string; streak: number }[]): Promise<void> {
    if (updates.length === 0) return;

    const client = this.redisServices.getClient();
    const pipeline = client.multi();

    updates.forEach(({ userId, streak }) => {
      pipeline.zAdd(LEADERBOARD_KEYS.STREAK, [{ score: streak, value: userId }]);
    });

    await pipeline.exec();
    this.logger.log(`Batch updated ${updates.length} streak scores`);
  }

  // --- Utility methods ---
  async getUserStreakWithRank(userId: string): Promise<{ streak: number; rank: number } | null> {
    const [streak, rank] = await Promise.all([
      this.getUserStreak(userId),
      this.getUserStreakRank(userId)
    ]);

    if (streak === null || rank === null) return null;

    return { streak, rank };
  }
}