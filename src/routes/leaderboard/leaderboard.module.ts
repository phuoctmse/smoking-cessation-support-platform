import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardResolver } from './leaderboard.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { LeaderboardRepository } from './leaderboard.repository'

@Module({
  imports: [
    GuardModule,
    SupabaseModule
  ],
  providers: [LeaderboardService, LeaderboardResolver, LeaderboardRepository],
  exports: [LeaderboardService],
})
export class LeaderboardModule {} 