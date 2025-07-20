import { Module } from '@nestjs/common';
import { CessationPlanTemplateService } from './cessation-plan-template.service';
import { CessationPlanTemplateResolver } from './cessation-plan-template.resolver';
import { CessationPlanTemplateRepository } from './cessation-plan-template.repository';
import {GuardModule} from "../../shared/guards/guard.module";
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { PlanStageTemplateModule } from '../plan-stage-template/plan-stage-template.module';

@Module({
  imports: [
    GuardModule,
    SupabaseModule,
    PlanStageTemplateModule,
  ],
  providers: [
    CessationPlanTemplateResolver,
    CessationPlanTemplateService,
    CessationPlanTemplateRepository,
  ],
  exports: [CessationPlanTemplateService, CessationPlanTemplateRepository],
})
export class CessationPlanTemplateModule {}