import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { LeaderboardService } from './leaderboard.service';
import { UserType } from '../user/schema/user.schema'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { LeaderboardStats } from './dto/response/leaderboard-stats.response'
import { PaginatedStreakLeaderboard } from './dto/response/paginated-streak-leaderboard.response'
import { StreakLeaderboardEntry } from './dto/response/streak-leaderboard-entry.response'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'

@Resolver()
@UseGuards(JwtAuthGuard)
export class LeaderboardResolver {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Query(() => PaginatedStreakLeaderboard)
  async streakLeaderboard(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() currentUser: UserType,
  ): Promise<PaginatedStreakLeaderboard> {
    return this.leaderboardService.getStreakLeaderboard({
      limit,
      offset,
      currentUserId: currentUser.id,
    });
  }

  @Query(() => StreakLeaderboardEntry, {
    nullable: true,
    description: "Get current user's streak and rank."
  })
  async myStreakRank(@CurrentUser() currentUser: UserType): Promise<StreakLeaderboardEntry | null> {
    return this.leaderboardService.getCurrentUserRank(currentUser.id);
  }

  @Query(() => LeaderboardStats)
  async streakLeaderboardStats(): Promise<LeaderboardStats> {
    return this.leaderboardService.getStreakLeaderboardStats();
  }
}