import { Inject, Injectable, Logger } from '@nestjs/common'
import { BadgeCriteriaEvaluator, BadgeEvaluationContext } from './interfaces/badge-criteria-evaluator.interface'
import { Badge } from '../badge/entities/badge.entity'

@Injectable()
export class BadgeAwardEngine {
  private readonly logger = new Logger(BadgeAwardEngine.name);

  constructor(
    @Inject('BADGE_CRITERIA_EVALUATORS') private readonly evaluators: BadgeCriteriaEvaluator[],
  ) {}

  async checkEligibility(badge: Badge, context: BadgeEvaluationContext): Promise<boolean> {
    if (!badge.requirements) {
      return false;
    }

    let parsedRequirements: any;
    try {
      if (typeof badge.requirements !== 'string') {
        this.logger.error(`Badge: ${badge.name}, 'requirements' field is not a string as expected by engine. Type: ${typeof badge.requirements}`);
        return false;
      }
      parsedRequirements = JSON.parse(badge.requirements);
    } catch (error) {
      this.logger.error(`Failed to parse requirements for badge ${badge.name}: '${badge.requirements}'`, error.stack);
      return false;
    }

    if (typeof parsedRequirements !== 'object' || parsedRequirements === null) {
      this.logger.warn(`Badge: ${badge.name}, Parsed requirements is not an object after JSON.parse. Actual type: ${typeof parsedRequirements}. Value:`, parsedRequirements);
      return false;
    }

    const criteriaType = parsedRequirements.criteria_type;

    if (!criteriaType) {
      this.logger.warn(`Badge ${badge.name} requirements missing 'criteria_type'. (Value of criteria_type was: '${criteriaType}')`);
      return false;
    }

    const evaluator = this.evaluators.find(ev => ev.canHandle(criteriaType));
    if (!evaluator) {
      this.logger.warn(`No evaluator found for criteria_type: ${criteriaType} in badge ${badge.name}.`);
      return false;
    }

    try {
      return await evaluator.evaluate(parsedRequirements, context);
    } catch (error) {
      this.logger.error(`Error evaluating badge ${badge.name} with criteria ${criteriaType}:`, error.stack);
      return false;
    }
  }
}