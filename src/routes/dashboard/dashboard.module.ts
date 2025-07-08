import { Module } from '@nestjs/common';
import { SearchModule } from '../../shared/modules/elasticsearch.module';
import { GuardModule } from '../../shared/guards/guard.module';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';

@Module({
  imports: [
    SearchModule,
    GuardModule
  ],
  providers: [DashboardService, DashboardResolver],
  exports: [DashboardService],
})
export class DashboardModule {} 