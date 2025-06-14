import { Injectable } from '@nestjs/common'
import { BadgeCriteriaEvaluator, BadgeEvaluationContext } from '../interfaces/badge-criteria-evaluator.interface'

@Injectable()
export class StreakAchievedEvaluator implements BadgeCriteriaEvaluator {
  private readonly CRITERIA_TYPE = 'streak_achieved';

  canHandle(criteriaType: string): boolean {
    return criteriaType === this.CRITERIA_TYPE;
  }

  async evaluate(requirements: any, context: BadgeEvaluationContext): Promise<boolean> {
    // Requirements: { "criteria_type": "streak_achieved", "days": 7 }
    // Context: { eventType: 'streak_updated', currentStreak: 10 }
    if (context.eventType === 'streak_updated' && typeof context.currentStreak === 'number') {
      return Promise.resolve(context.currentStreak >= requirements.days);
    }
    return Promise.resolve(false);
  }
}