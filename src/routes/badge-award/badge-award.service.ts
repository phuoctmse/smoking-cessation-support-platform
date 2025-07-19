import { Injectable, Logger } from '@nestjs/common'
import { BadgeRepository } from '../badge/badge.repository'
import { UserBadgeRepository } from '../user-badge/user-badge.repository'
import { BadgeAwardEngine } from './badge-award.engine'
import { BadgeEvaluationContext } from './interfaces/badge-criteria-evaluator.interface'
import {Badge} from "../badge/entities/badge.entity";
import { NotificationEventService } from '../notification/notification.event'

@Injectable()
export class BadgeAwardService {
  private readonly logger = new Logger(BadgeAwardService.name);

  constructor(
    private readonly badgeRepository: BadgeRepository,
    private readonly userBadgeRepository: UserBadgeRepository,
    private readonly badgeAwardEngine: BadgeAwardEngine,
    private readonly notificationEventService: NotificationEventService,
  ) {}

  async evaluateAndAwardBadges(context: BadgeEvaluationContext): Promise<void> {
    this.logger.log(`Evaluating badges for user ${context.userId}, event: ${context.eventType}`);
    const activeBadgesResult = await this.badgeRepository.findAll(
      { page: 1, limit: 500, orderBy: 'created_at', sortOrder: 'asc' },
    );

    for (const badgeFromRepo of activeBadgesResult.data) {
      let requirementsString: string | undefined = undefined;
      if (badgeFromRepo.requirements != null) {
        if (typeof badgeFromRepo.requirements === 'string') {
          requirementsString = badgeFromRepo.requirements;
        } else if (typeof badgeFromRepo.requirements === 'object') {
          requirementsString = JSON.stringify(badgeFromRepo.requirements);
        } else {
          this.logger.warn(`Badge ${badgeFromRepo.name} has requirements of unexpected type: ${typeof badgeFromRepo.requirements}`);
        }
      }

      const badgeForEngine: Badge = {
        id: badgeFromRepo.id,
        name: badgeFromRepo.name,
        description: badgeFromRepo.description ?? undefined,
        icon_url: badgeFromRepo.icon_url ?? undefined,
        badge_type: badgeFromRepo.badge_type,
        requirements: requirementsString,
        is_active: badgeFromRepo.is_active,
        sort_order: badgeFromRepo.sort_order,
        created_at: badgeFromRepo.created_at,
        updated_at: badgeFromRepo.updated_at,
      };

      const isEligible = await this.badgeAwardEngine.checkEligibility(badgeForEngine, context);
      if (isEligible) {
        const existingUserBadge = await this.userBadgeRepository.findUserBadges(
          context.userId,
          { page: 1, limit: 1, orderBy: 'created_at', sortOrder: 'asc' },
          { badge_id: badgeForEngine.id },
        );
        if (existingUserBadge.total === 0) {
          await this.userBadgeRepository.awardBadge(context.userId, badgeForEngine.id);
          this.logger.log(`Awarded badge "${badgeForEngine.name}" to user ${context.userId}.`);
          await this.notificationEventService.sendBadgeEarnedNotification(
            context.userId,
            badgeForEngine.name,
            badgeForEngine.description
          );
        }
      }
    }
  }

  async processPlanCreation(userId: string, planId: string): Promise<void> {
    const context: BadgeEvaluationContext = {
      userId,
      eventType: 'plan_created_first',
      planId,
    };
    await this.evaluateAndAwardBadges(context);
  }

  async processStreakUpdate(userId: string, currentStreak: number): Promise<void> {
    const context: BadgeEvaluationContext = {
      userId,
      eventType: 'streak_updated',
      currentStreak,
    };
    await this.evaluateAndAwardBadges(context);

    if (this.isSignificantStreakMilestone(currentStreak)) {
      await this.notificationEventService.sendStreakMilestoneNotification(userId, currentStreak);
    }
  }

  async processStageCompletion(userId: string, planId: string, completedStagesInPlan: number): Promise<void> {
    const context: BadgeEvaluationContext = {
      userId,
      eventType: 'stage_completed',
      planId,
      completedStagesInPlan,
    };
    await this.evaluateAndAwardBadges(context);
  }

  async processPlanCompletion(userId: string, planId: string): Promise<void> {
    const context: BadgeEvaluationContext = {
      userId,
      eventType: 'plan_completed',
      planId,
    }
    await this.evaluateAndAwardBadges(context)
  }

  private isSignificantStreakMilestone(streakDays: number): boolean {
    const milestones = [1, 3, 7, 14, 30, 60, 90, 180, 365];
    return milestones.includes(streakDays);
  }
}