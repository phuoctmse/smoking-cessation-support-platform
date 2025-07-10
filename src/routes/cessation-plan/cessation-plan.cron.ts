import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CessationPlanStatus } from '@prisma/client'
import { RedisServices } from '../../shared/services/redis.service';
import {
  buildCacheKey,
  buildOneCacheKey,
  invalidateCacheForId
} from '../../shared/utils/cache-key.util';

@Injectable()
export class CessationPlanCronService {
  private readonly logger = new Logger(CessationPlanCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisServices: RedisServices,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async activatePendingPlans() {
    this.logger.log('Checking for cessation plans ready to activate...');

    try {
      const now = new Date();

      const plansToActivate = await this.prisma.cessationPlan.findMany({
        where: {
          status: CessationPlanStatus.PLANNING,
          start_date: { lte: now },
        },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (plansToActivate.length === 0) {
        this.logger.log('No plans to activate');
        return;
      }

      const result = await this.prisma.cessationPlan.updateMany({
        where: {
          status: CessationPlanStatus.PLANNING,
          start_date: { lte: now },
        },
        data: { status: CessationPlanStatus.ACTIVE },
      });

      this.logger.log(`✅ Activated ${result.count} cessation plans`);
      await this.invalidatePlansCache(plansToActivate);

    } catch (error) {
      this.logger.error('Error activating cessation plans:', error);
    }
  }

  private async invalidatePlansCache(plans: { id: string; user_id: string }[]): Promise<void> {
    try {
      const cacheKeys: string[] = [];
      const userIds = new Set<string>();

      for (const plan of plans) {
        cacheKeys.push(buildOneCacheKey('cessation-plan', plan.id));
        cacheKeys.push(buildCacheKey('cessation-plan', 'byUser', plan.user_id));
        userIds.add(plan.user_id);
      }

      if (cacheKeys.length > 0) {
        await this.redisServices.getClient().del(cacheKeys);
      }
      for (const userId of userIds) {
        await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan', userId);
      }
      await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan', 'all-lists');
      await invalidateCacheForId(this.redisServices.getClient(), 'cessation-plan', 'stats-cache');

      this.logger.log(`Invalidated cache for ${plans.length} activated plans`);
    } catch (cacheError) {
      this.logger.error('Error invalidating cache:', cacheError);
    }
  }
}