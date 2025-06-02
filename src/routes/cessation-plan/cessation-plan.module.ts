import { Module } from '@nestjs/common';
import { CessationPlanService } from './cessation-plan.service';
import { CessationPlanResolver } from './cessation-plan.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { CessationPlanRepository } from './cessation-plan.repository'

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [
    CessationPlanResolver,
    CessationPlanService,
    CessationPlanRepository,
  ],
  exports: [CessationPlanService, CessationPlanRepository],
})
export class CessationPlanModule {}
