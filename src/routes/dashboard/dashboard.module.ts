import { Module } from '@nestjs/common'
import { GuardModule } from 'src/shared/guards/guard.module'
import { PrismaService } from 'src/shared/services/prisma.service'
import { DashboardResolver } from './dashboard.resolver'
import { DashboardService } from './dashboard.service'
import { DashboardRepository } from './dashboard.repo'

@Module({
  imports: [GuardModule],
  providers: [
    DashboardResolver,
    DashboardService,
    DashboardRepository,
    PrismaService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
