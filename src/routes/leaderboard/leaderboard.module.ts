import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardResolver } from './leaderboard.resolver';
import { RedisServices } from 'src/shared/services/redis.service';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule
  ],
  providers: [LeaderboardService, LeaderboardResolver, RedisServices],
  exports: [LeaderboardService],
})
export class LeaderboardModule {} 