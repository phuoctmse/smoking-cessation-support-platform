import { Field, Int, ObjectType } from '@nestjs/graphql'
import { StreakLeaderboardEntry } from './streak-leaderboard-entry.response'

@ObjectType()
export class PaginatedStreakLeaderboard {
  @Field(() => [StreakLeaderboardEntry])
  data: StreakLeaderboardEntry[];

  @Field(() => Int)
  total: number;

  @Field(() => StreakLeaderboardEntry, { nullable: true, description: "Current user's rank, if they are on the leaderboard." })
  myRank?: StreakLeaderboardEntry;
}