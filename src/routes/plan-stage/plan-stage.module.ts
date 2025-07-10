import { forwardRef, Module } from '@nestjs/common'
import { PlanStageService } from './plan-stage.service'
import { PlanStageResolver } from './plan-stage.resolver'
import { PlanStageRepository } from './plan-stage.repository'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { CessationPlanModule } from '../cessation-plan/cessation-plan.module'
import { BadgeAwardModule } from '../badge-award/badge-award.module'
import { PlanStageCronService } from './plan-stage.cron'
import { RedisServices } from '../../shared/services/redis.service'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => CessationPlanModule),
    BadgeAwardModule
  ],
  providers: [
    PlanStageResolver,
    PlanStageService,
    PlanStageRepository,
    PlanStageCronService,
    RedisServices,
  ],
  exports: [PlanStageService, PlanStageRepository],
})
export class PlanStageModule {}
