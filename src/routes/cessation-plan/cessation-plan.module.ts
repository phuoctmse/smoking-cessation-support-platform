import { forwardRef, Module } from '@nestjs/common'
import { CessationPlanService } from './cessation-plan.service'
import { CessationPlanResolver } from './cessation-plan.resolver'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { CessationPlanRepository } from './cessation-plan.repository'
import { PlanStageModule } from '../plan-stage/plan-stage.module'
import { BadgeAwardModule } from '../badge-award/badge-award.module'
import { SubscriptionGuard } from 'src/shared/guards/subscription.guard'
import { CessationPlanTemplateModule } from '../cessation-plan-template/cessation-plan-template.module'
import { CessationPlanCronService } from './cessation-plan.cron'
import { RedisServices } from 'src/shared/services/redis.service'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => PlanStageModule),
    BadgeAwardModule,
    CessationPlanTemplateModule,
  ],
  providers: [
    CessationPlanResolver,
    CessationPlanService,
    CessationPlanRepository,
    SubscriptionGuard,
    CessationPlanCronService,
    RedisServices,
  ],
  exports: [
    CessationPlanService,
    CessationPlanRepository
  ],
})
export class CessationPlanModule { }
