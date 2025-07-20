import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardResolver } from './leaderboard.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule
  ],
  providers: [LeaderboardService, LeaderboardResolver],
  exports: [LeaderboardService],
})
export class LeaderboardModule {} 