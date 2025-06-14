export interface BadgeEvaluationContext {
  userId: string;
  eventType: string;
  [key: string]: any;
}

export interface BadgeCriteriaEvaluator {
  canHandle(criteriaType: string): boolean;
  evaluate(requirements: any, context: BadgeEvaluationContext): Promise<boolean>;
}