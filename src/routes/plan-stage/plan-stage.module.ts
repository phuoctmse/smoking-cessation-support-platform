import { forwardRef, Module } from '@nestjs/common'
import { PlanStageService } from './plan-stage.service'
import { PlanStageResolver } from './plan-stage.resolver'
import { PlanStageRepository } from './plan-stage.repository'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { CessationPlanModule } from '../cessation-plan/cessation-plan.module'
import { BadgeAwardModule } from '../badge-award/badge-award.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => CessationPlanModule),
    BadgeAwardModule
  ],
  providers: [PlanStageResolver, PlanStageService, PlanStageRepository],
  exports: [PlanStageService, PlanStageRepository],
})
export class PlanStageModule {}
