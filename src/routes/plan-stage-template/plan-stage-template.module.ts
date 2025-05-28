import { Module } from '@nestjs/common'
import { GuardModule } from '../../shared/guards/guard.module'
import { CessationPlanTemplateModule } from '../cessation-plan-template/cessation-plan-template.module'
import { PlanStageTemplateResolver } from './plan-stage-template.resolver'
import { PlanStageTemplateService } from './plan-stage-template.service'
import { PlanStageTemplateRepository } from './plan-stage-template.repository'
import { SupabaseModule } from '../../shared/modules/supabase.module'

@Module({
  imports: [GuardModule, SupabaseModule, CessationPlanTemplateModule],
  providers: [
    PlanStageTemplateResolver,
    PlanStageTemplateService,
    PlanStageTemplateRepository,
  ],
  exports: [PlanStageTemplateService, PlanStageTemplateRepository],
})
export class PlanStageTemplateModule {}