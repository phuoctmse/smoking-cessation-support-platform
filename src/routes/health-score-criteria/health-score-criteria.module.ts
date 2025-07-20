import { Module } from '@nestjs/common';
import { HealthScoreCriteriaService } from './health-score-criteria.service';
import { HealthScoreCriteriaResolver } from './health-score-criteria.resolver';
import { GuardModule } from '../../shared/guards/guard.module'
import { SupabaseModule } from '../../shared/modules/supabase.module'
import { HealthScoreCriteriaRepository } from './health-score-criteria.repository'

@Module({
  imports: [GuardModule, SupabaseModule],
  providers: [
    HealthScoreCriteriaResolver,
    HealthScoreCriteriaService,
    HealthScoreCriteriaRepository,
  ],
  exports: [HealthScoreCriteriaService, HealthScoreCriteriaRepository],
})
export class HealthScoreCriteriaModule {}
