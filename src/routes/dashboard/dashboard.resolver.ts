import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SystemStats } from './entities/system-stats.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { LogEntry } from './entities/log-entry.entity';
import { ErrorStats } from './entities/error-stats.entity';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => SystemStats)
  async getSystemStats() {
    return this.dashboardService.getSystemStats();
  }

  @Query(() => [LogEntry])
  async getRecentLogs(
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number
  ) {
    return this.dashboardService.getRecentLogs(limit);
  }

  @Query(() => ErrorStats)
  async getErrorStats(
    @Args('timeRange', { defaultValue: '24h' }) timeRange: string
  ) {
    return this.dashboardService.getErrorStats(timeRange);
  }

  @Query(() => [LogEntry])
  async searchLogs(
    @Args('query') query: string,
    @Args('timeRange', { defaultValue: '24h' }) timeRange: string
  ) {
    return this.dashboardService.searchLogs(query, timeRange);
  }
} 