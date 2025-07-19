import { forwardRef, Module } from '@nestjs/common'
import { CessationPlanService } from './cessation-plan.service'
import { CessationPlanResolver } from './cessation-plan.resolver'
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { CessationPlanRepository } from './cessation-plan.repository'
import { PlanStageModule } from '../plan-stage/plan-stage.module'
import { BadgeAwardModule } from '../badge-award/badge-award.module'
import { SubscriptionGuard } from 'src/shared/guards/subscription.guard'
import { CustomAIRecommendationService } from '../../shared/services/custom-ai-recommendation.service';
import { CessationPlanTemplateModule } from '../cessation-plan-template/cessation-plan-template.module'
import { CessationPlanCronService } from './cessation-plan.cron'
import { RedisServices } from 'src/shared/services/redis.service'
import { NotificationModule } from '../notification/notification.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    forwardRef(() => PlanStageModule),
    BadgeAwardModule,
    CessationPlanTemplateModule,
    NotificationModule,
    UserModule,
  ],
  providers: [
    CessationPlanResolver,
    CessationPlanService,
    CessationPlanRepository,
    SubscriptionGuard,
    CustomAIRecommendationService,
    CessationPlanCronService,
    RedisServices,
  ],
  exports: [CessationPlanService, CessationPlanRepository],
})
export class CessationPlanModule { }
