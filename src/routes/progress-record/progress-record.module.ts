import { forwardRef, Module } from '@nestjs/common'
import { ProgressRecordService } from './progress-record.service';
import { ProgressRecordResolver } from './progress-record.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'
import { CessationPlanModule } from '../cessation-plan/cessation-plan.module'
import { ProgressRecordRepository } from './progress-record.repository'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { BadgeAwardModule } from '../badge-award/badge-award.module'
import { LeaderboardModule } from '../leaderboard/leaderboard.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => CessationPlanModule),
    BadgeAwardModule,
    LeaderboardModule
  ],
  providers: [
    ProgressRecordResolver,
    ProgressRecordService,
    ProgressRecordRepository,
  ],
  exports: [
    ProgressRecordService,
    ProgressRecordRepository
  ],
})
export class ProgressRecordModule {}
