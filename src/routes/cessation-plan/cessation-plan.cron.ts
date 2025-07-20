import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'
import { Cron } from '@nestjs/schedule'
import { CessationPlanStatus } from '@prisma/client'
import { RedisServices } from '../../shared/services/redis.service';
import {
  buildCacheKey,
  invalidateCacheForId
} from '../../shared/utils/cache-key.util';
import { NotificationEventService } from '../notification/notification.event'

@Injectable()
export class CessationPlanCronService {
    private readonly logger = new Logger(CessationPlanCronService.name)

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisServices: RedisServices,
        private readonly notificationEventService: NotificationEventService,
    ) {}

    @Cron('0 0 * * *')
    //@Cron('* * * * *') // testing
    async activatePendingPlans() {
        this.logger.log('Checking for cessation plans ready to activate...')

        try {
            const now = new Date()

            const plansToActivate = await this.prisma.cessationPlan.findMany({
                where: {
                    status: CessationPlanStatus.PLANNING,
                    start_date: { lte: now },
                },
                select: {
                    id: true,
                    user_id: true,
                },
            })

            if (plansToActivate.length === 0) {
                this.logger.log('No plans to activate')
                return
            }

            const result = await this.prisma.cessationPlan.updateMany({
                where: {
                    status: CessationPlanStatus.PLANNING,
                    start_date: { lte: now },
                },
                data: { status: CessationPlanStatus.ACTIVE },
            })

            this.logger.log(`Activated ${result.count} cessation plans`)
            await this.invalidatePlansCache(plansToActivate)

        } catch (error) {
            this.logger.error('Error activating cessation plans:', error)
        }
    }

    @Cron('0 0 * * *')
    //@Cron('* * * * *') // testing
    async checkAndAbandonPlansWithStageViolations() {
        try {
            const now = new Date()
            const gracePeriodDays = 5

            const violatingPlans = await this.findPlansWithStageViolations(now, gracePeriodDays)

            if (violatingPlans.length === 0) {
                this.logger.log('No plans violate stage progress requirements')
                return
            }

            await this.abandonPlansWithReasons(violatingPlans, now)

        } catch (error) {
            this.logger.error('Error checking stage violations:', error)
        }
    }

    private async findPlansWithStageViolations(now: Date, gracePeriodDays: number) {
        const activePlans = await this.prisma.cessationPlan.findMany({
            where: {
                status: CessationPlanStatus.ACTIVE,
                is_deleted: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        user_name: true
                    }
                },
                template: {
                    select: {
                        name: true
                    }
                },
                stages: {
                    where: {
                        is_deleted: false
                    },
                    select: {
                        id: true,
                        title: true,
                        stage_order: true,
                        status: true,
                        start_date: true,
                        end_date: true,
                    },
                    orderBy: {
                        stage_order: 'asc'
                    }
                }
            }
        })

        const violatingPlans = []

        for (const plan of activePlans) {
            const violations = await this.checkPlanStageViolations(plan, now, gracePeriodDays)
            if (violations.length > 0) {
                violatingPlans.push({
                    ...plan,
                    violations
                })
            }
        }

        return violatingPlans
    }

    private async checkPlanStageViolations(plan: any, now: Date, gracePeriodDays: number) {
        const violations = []

        for (const stage of plan.stages) {
            if (!stage.end_date) continue

            const graceEndDate = new Date(stage.end_date)
            graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays)

            // Case 1: Stage quá hạn (+ grace period) mà chưa complete
            const isOverdueAndNotCompleted =
                now > graceEndDate &&
                stage.status !== 'COMPLETED'

            // Case 2: Thiếu progress records trong stage period cho toàn bộ plan
            const hasNoProgressRecords = await this.checkMissingProgressRecords(
                plan.id,
                stage.start_date,
                stage.end_date
            )

            if (isOverdueAndNotCompleted || hasNoProgressRecords) {
                violations.push({
                    stage_id: stage.id,
                    stage_title: stage.title,
                    stage_order: stage.stage_order,
                    violation_type: isOverdueAndNotCompleted ? 'OVERDUE_NOT_COMPLETED' : 'NO_PROGRESS_RECORDS',
                    stage_end_date: stage.end_date,
                    grace_end_date: graceEndDate,
                    days_overdue: Math.floor((now.getTime() - graceEndDate.getTime()) / (1000 * 60 * 60 * 24))
                })
            }
        }

        return violations
    }

    private async checkMissingProgressRecords(
        planId: string,
        startDate: Date | null,
        endDate: Date | null
    ): Promise<boolean> {
        if (!startDate || !endDate) return false

        const progressRecordCount = await this.prisma.progressRecord.count({
            where: {
                plan_id: planId,
                record_date: {
                    gte: startDate,
                    lte: endDate,
                },
                is_deleted: false,
            }
        })

        return progressRecordCount === 0
    }

    private async abandonPlansWithReasons(violatingPlans: any[], now: Date): Promise<void> {
        try {
            const planIds = violatingPlans.map(p => p.id)

            // Update plans to ABANDONED status
            const result = await this.prisma.cessationPlan.updateMany({
                where: {
                    id: { in: planIds },
                },
                data: {
                    status: CessationPlanStatus.ABANDONED,
                    updated_at: now,
                },
            })

            this.logger.log(`Marked ${result.count} plans as ABANDONED due to stage violations`)

            // Send notifications to users
            for (const plan of violatingPlans) {
                try {
                    const planDisplayName = this.getPlanDisplayName(plan)

                    await this.notificationEventService.sendPlanAbandonedDueToStageViolationsNotification(
                        plan.user_id,
                        planDisplayName,
                        plan.violations
                    )
                } catch (notificationError) {
                    this.logger.error(
                        `Failed to send stage violation notification for plan ${plan.id}: ${notificationError.message}`
                    )
                }
            }

            // Invalidate caches
            await this.invalidatePlansCache(violatingPlans.map(p => ({ id: p.id, user_id: p.user_id })))

        } catch (error) {
            this.logger.error('Error abandoning plans with stage violations:', error)
            throw error
        }
    }

    private getPlanDisplayName(plan: any): string {
        if (plan.template?.name) {
            return plan.template.name
        }
        if (plan.reason) {
            return `Kế hoạch: ${plan.reason}`
        }
        return 'Kế hoạch cai thuốc'
    }

    private async invalidatePlansCache(plans: { id: string; user_id: string }[]): Promise<void> {
        try {
            const client = this.redisServices.getClient()

            const planCacheKeys = plans.map(
                plan => buildCacheKey('cessation-plan', 'one', plan.id)
            )
            if (planCacheKeys.length > 0) {
                await client.del(planCacheKeys)
            }

            const userIds = [...new Set(plans.map(p => p.user_id))]
            for (const userId of userIds) {
                const userCacheKeys = [
                    buildCacheKey('cessation-plan', 'byUser', userId),
                ]
                await client.del(userCacheKeys)
                await invalidateCacheForId(client, 'cessation-plan', userId)
            }

            await invalidateCacheForId(client, 'cessation-plan', 'all-lists')
            await invalidateCacheForId(client, 'cessation-plan', 'stats-cache')
        } catch (cacheError) {
            this.logger.error('Error invalidating cache:', cacheError)
        }
    }
}