import { Injectable } from '@nestjs/common'
import { BadgeCriteriaEvaluator, BadgeEvaluationContext } from '../interfaces/badge-criteria-evaluator.interface'

@Injectable()
export class FirstPlanCreatedEvaluator implements BadgeCriteriaEvaluator {
  private readonly CRITERIA_TYPE = 'first_plan_created';

  canHandle(criteriaType: string): boolean {
    return criteriaType === this.CRITERIA_TYPE;
  }

  async evaluate(requirements: any, context: BadgeEvaluationContext): Promise<boolean> {
    // Requirements for this badge can be simple: { "criteria_type": "first_plan_created" }
    // Context eventType must be 'plan_created_first' (determined by the calling service)
    return Promise.resolve(context.eventType === 'plan_created_first');
  }
}