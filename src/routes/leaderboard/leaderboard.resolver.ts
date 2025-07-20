import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { LeaderboardService } from './leaderboard.service';
import { UserType } from '../user/schema/user.schema'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PrismaService } from '../../shared/services/prisma.service'
import { LeaderboardStats } from './dto/response/leaderboard-stats.response'
import { PaginatedStreakLeaderboard } from './dto/response/paginated-streak-leaderboard.response'
import { StreakLeaderboardEntry } from './dto/response/streak-leaderboard-entry.response'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'

@Resolver()
export class LeaderboardResolver {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => PaginatedStreakLeaderboard)
  async streakLeaderboard(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() currentUser: UserType,
  ): Promise<PaginatedStreakLeaderboard> {
    const rawLeaderboard = await this.leaderboardService.getTopStreaks(limit, offset);
    if (rawLeaderboard.length === 0) {
      return { data: [], total: 0 };
    }

    const userIds = rawLeaderboard.map(entry => entry.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, user_name: true, avatar_url: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const data = rawLeaderboard.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        rank: offset + index + 1,
        userId: entry.userId,
        userName: user?.user_name || 'Unknown User',
        avatarUrl: user?.avatar_url,
        streak: entry.score,
      };
    });

    let myRank: StreakLeaderboardEntry | undefined;
    const myStreakData = await this.leaderboardService.getUserStreakWithRank(currentUser.id);

    if (myStreakData) {
      myRank = {
        rank: myStreakData.rank,
        userId: currentUser.id,
        userName: currentUser.user_name,
        avatarUrl: currentUser.avatar_url,
        streak: myStreakData.streak,
      };
    }

    const stats = await this.leaderboardService.getStreakLeaderboardStats();

    return { data, total: stats.totalUsers, myRank };
  }

  @Query(() => StreakLeaderboardEntry, {
    nullable: true, description: "Get current user's streak and rank."
  })
  @UseGuards(JwtAuthGuard)
  async myStreakRank(@CurrentUser() currentUser: UserType): Promise<StreakLeaderboardEntry | null> {
    const streakData = await this.leaderboardService.getUserStreakWithRank(currentUser.id);
    if (!streakData) {
      return null;
    }

    return {
      rank: streakData.rank,
      userId: currentUser.id,
      userName: currentUser.user_name,
      avatarUrl: currentUser.avatar_url,
      streak: streakData.streak,
    };
  }

  @Query(() => LeaderboardStats)
  async streakLeaderboardStats(): Promise<LeaderboardStats> {
    return this.leaderboardService.getStreakLeaderboardStats();
  }
}