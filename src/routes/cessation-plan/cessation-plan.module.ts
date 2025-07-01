import { forwardRef, Module } from '@nestjs/common'
import { CessationPlanService } from './cessation-plan.service'
import { CessationPlanResolver } from './cessation-plan.resolver'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { CessationPlanRepository } from './cessation-plan.repository'
import { PlanStageModule } from '../plan-stage/plan-stage.module'
import { BadgeAwardModule } from '../badge-award/badge-award.module'
import { SubscriptionGuard } from 'src/shared/guards/subscription.guard'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => PlanStageModule),
    BadgeAwardModule,
  ],
  providers: [CessationPlanResolver, CessationPlanService, CessationPlanRepository, SubscriptionGuard],
  exports: [CessationPlanService, CessationPlanRepository],
})
export class CessationPlanModule { }
