import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { Cron } from '@nestjs/schedule'
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

  //@Cron('0 0 * * *')
  @Cron('* * * * *') // testing
  async activatePendingStages() {
    try {
      const now = new Date();
      const todayEndOfDay = new Date(now);
      todayEndOfDay.setHours(23, 59, 59, 999);

      const activePlans = await this.prisma.cessationPlan.findMany({
        where: {
          status: CessationPlanStatus.ACTIVE,
          is_deleted: false,
        },
        include: {
          stages: {
            where: { is_deleted: false },
            orderBy: { stage_order: 'asc' },
            select: {
              id: true,
              stage_order: true,
              title: true,
              status: true,
              start_date: true,
            },
          },
        },
      });

      const stagesToActivate: {
        id: string;
        plan_id: string;
        title: string;
        start_date: Date | null;
        plan: { user_id: string };
      }[] = [];

      for (const plan of activePlans) {
        const eligibleStage = this.findNextEligibleStage(plan.stages, todayEndOfDay);

        if (eligibleStage) {
          stagesToActivate.push({
            id: eligibleStage.id,
            plan_id: plan.id,
            title: eligibleStage.title,
            start_date: eligibleStage.start_date,
            plan: { user_id: plan.user_id },
          });
        }
      }

      if (stagesToActivate.length === 0) {
        this.logger.log('No stages eligible for activation');
        return;
      }

      let activatedCount = 0;
      for (const stage of stagesToActivate) {
        try {
          await this.prisma.planStage.update({
            where: {
              id: stage.id,
              status: PlanStageStatus.PENDING,
            },
            data: { status: PlanStageStatus.ACTIVE },
          });
          activatedCount++;

          this.logger.log(
            `Activated stage "${stage.title}" (${stage.id}) for plan ${stage.plan_id}`
          );
        } catch (error) {
          this.logger.error(
            `Failed to activate stage "${stage.title}" (${stage.id}): ${error.message}`
          );
        }
      }

      this.logger.log(`Successfully activated ${activatedCount}/${stagesToActivate.length} plan stages`);

      if (activatedCount > 0) {
        await this.invalidateStagesCache(stagesToActivate);
      }

    } catch (error) {
      this.logger.error('Error activating plan stages:', error);
    }
  }

  private findNextEligibleStage(
    stages: {
      id: string;
      stage_order: number | null;
      title: string;
      status: string;
      start_date: Date | null;
    }[],
    todayEndOfDay: Date
  ): {
    id: string;
    stage_order: number | null;
    title: string;
    start_date: Date | null;
  } | null {
    const orderedStages = stages
      .filter(stage => stage.stage_order !== null)
      .sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0));

    if (orderedStages.length === 0) {
      return null;
    }

    for (let i = 0; i < orderedStages.length; i++) {
      const currentStage = orderedStages[i];

      if (currentStage.status !== PlanStageStatus.PENDING) {
        continue;
      }

      if (currentStage.start_date && new Date(currentStage.start_date) > todayEndOfDay) {
        continue;
      }

      const previousStagesCompleted = this.areAllPreviousStagesCompleted(orderedStages, i);

      if (!previousStagesCompleted.allCompleted) {
        continue;
      }

      return currentStage;
    }

    return null;
  }

  private areAllPreviousStagesCompleted(
    orderedStages: { stage_order: number | null; status: string; title: string }[],
    currentIndex: number
  ): {
    allCompleted: boolean;
    blockingStage?: { stage_order: number | null; title: string; status: string }
  } {
    if (currentIndex === 0) {
      return { allCompleted: true };
    }

    for (let i = 0; i < currentIndex; i++) {
      const previousStage = orderedStages[i];

      if (previousStage.status !== PlanStageStatus.COMPLETED) {
        return {
          allCompleted: false,
          blockingStage: {
            stage_order: previousStage.stage_order,
            title: previousStage.title,
            status: previousStage.status,
          },
        };
      }
    }

    return { allCompleted: true };
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
        cacheKeys.push(buildCacheKey('plan-stage', 'activeByPlan', stage.plan_id));

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
      await invalidateCacheForId(this.redisServices.getClient(), 'plan-stage', 'stats-cache');
    } catch (cacheError) {
      this.logger.error('Error invalidating stage activation cache:', cacheError);
    }
  }
}