import { Module } from '@nestjs/common'
import { FeedbackService } from './feedback.service';
import { FeedbackResolver } from './feedback.resolver'
import { GuardModule } from 'src/shared/guards/guard.module'
import { CessationPlanTemplateModule } from '../cessation-plan-template/cessation-plan-template.module'
import { FeedbackRepository } from './feedback.repository'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import {CessationPlanModule} from "../cessation-plan/cessation-plan.module";
import {PlanStageModule} from "../plan-stage/plan-stage.module";
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    CessationPlanTemplateModule,
    CessationPlanModule,
    PlanStageModule,
    UserModule,
  ],
  providers: [FeedbackResolver, FeedbackService, FeedbackRepository],
  exports: [FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}