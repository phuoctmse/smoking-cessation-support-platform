import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CessationPlanStatus, PlanStageStatus } from '@prisma/client'
import { RedisServices } from '../../shared/services/redis.service';
import {
  buildCacheKey,
  buildOneCacheKey,
  invalidateCacheForId
} from '../../shared/utils/cache-key.util';

@Injectable()
export class PlanStageCronService {
  private readonly logger = new Logger(PlanStageCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisServices: RedisServices,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async activatePendingStages() {
    try {
      const now = new Date();

      const stagesToActivate = await this.prisma.planStage.findMany({
        where: {
          status: PlanStageStatus.PENDING,
          start_date: { lte: now },
          plan: { status: CessationPlanStatus.ACTIVE },
        },
        select: {
          id: true,
          plan_id: true,
          plan: {
            select: {
              user_id: true,
            },
          },
        },
      });

      if (stagesToActivate.length === 0) {
        this.logger.log('No stages to activate');
        return;
      }

      const result = await this.prisma.planStage.updateMany({
        where: {
          status: PlanStageStatus.PENDING,
          start_date: { lte: now },
          plan: { status: CessationPlanStatus.ACTIVE },
        },
        data: { status: PlanStageStatus.ACTIVE },
      });

      this.logger.log(`Activated ${result.count} plan stages`);

      await this.invalidateStagesCache(stagesToActivate);

    } catch (error) {
      this.logger.error('Error activating plan stages:', error);
    }
  }

  private async invalidateStagesCache(
    stages: { id: string; plan_id: string; plan: { user_id: string } }[]
  ): Promise<void> {
    try {
      const cacheKeys: string[] = [];
      const planIds = new Set<string>();
      const userIds = new Set<string>();

      for (const stage of stages) {
        cacheKeys.push(buildOneCacheKey('plan-stage', stage.id));
        cacheKeys.push(buildCacheKey('plan-stage', 'byPlan', stage.plan_id));
        cacheKeys.push(buildOneCacheKey('cessation-plan', stage.plan_id));
        cacheKeys.push(buildCacheKey('cessation-plan', 'byUser', stage.plan.user_id));

        planIds.add(stage.plan_id);
        userIds.add(stage.plan.user_id);
      }

      if (cacheKeys.length > 0) {
        await this.redisServices.getClient().del(cacheKeys);
      }

      for (const planId of planIds) {
        await invalidateCacheForId(this.redisServices.getClient(), 'plan-stage', planId);
      }

      for (const userId of userIds) {
        await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan', userId);
      }

      await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan', 'all-lists');
      await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan', 'stats-cache');
    } catch (cacheError) {
      this.logger.error('Error invalidating cache:', cacheError);
    }
  }
}