import { Module } from '@nestjs/common';
import { BadgeAwardService } from './badge-award.service';
import { BadgeModule } from '../badge/badge.module'
import { UserBadgeModule } from '../user-badge/user-badge.module'
import { BadgeAwardEngine } from './badge-award.engine'
import { FirstPlanCreatedEvaluator } from './evaluators/first-plan-created.evaluator'
import { StreakAchievedEvaluator } from './evaluators/streak-achieved.evaluator'
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BadgeModule,
    UserBadgeModule,
    NotificationModule,
  ],
  providers: [
    BadgeAwardService,
    BadgeAwardEngine,
    FirstPlanCreatedEvaluator,
    StreakAchievedEvaluator,
    // StagesCompletedEvaluator,
    {
      provide: 'BADGE_CRITERIA_EVALUATORS',
      useFactory: (
        firstPlanEval: FirstPlanCreatedEvaluator,
        streakEval: StreakAchievedEvaluator,
        // stagesEval: StagesCompletedEvaluator,
      ) => [
        firstPlanEval,
        streakEval,
        // stagesEval,
      ],
      inject: [
        FirstPlanCreatedEvaluator,
        StreakAchievedEvaluator,
        // StagesCompletedEvaluator,
      ],
    },
  ],
  exports: [BadgeAwardService],
})
export class BadgeAwardModule {}