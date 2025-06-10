import { forwardRef, Module } from '@nestjs/common'
import { ProgressRecordService } from './progress-record.service';
import { ProgressRecordResolver } from './progress-record.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'
import { CessationPlanModule } from '../cessation-plan/cessation-plan.module'
import { ProgressRecordRepository } from './progress-record.repository'
import { SupabaseModule } from '../../shared/modules/supabase.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => CessationPlanModule)
  ],
  providers: [
    ProgressRecordResolver,
    ProgressRecordService,
    ProgressRecordRepository
  ],
  exports: [ProgressRecordService, ProgressRecordRepository],
})
export class ProgressRecordModule {}
