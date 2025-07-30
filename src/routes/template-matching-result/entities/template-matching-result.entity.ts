import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { CessationPlanTemplate } from '../../cessation-plan-template/entities/cessation-plan-template.entity';
import { User } from '../../user/entities/user.entity';
import { GraphQLJSON } from 'graphql-type-json';

export enum RecommendationLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

@ObjectType()
export class TemplateMatchingResult {
  @Field(() => ID)
  id: string;

  @Field()
  user_id: string;

  @Field()
  template_id: string;

  @Field(() => Float, { description: 'Matching score from AI (0-100)' })
  matching_score: number;

  @Field(() => GraphQLJSON, { description: 'Detailed matching factors and AI explanation' })
  matching_factors: any;

  @Field(() => String, { description: 'Recommendation level: HIGH, MEDIUM, LOW' })
  recommendation_level: string;

  @Field()
  created_at: Date;

  @Field(() => User)
  user: User;

  @Field(() => CessationPlanTemplate)
  template: CessationPlanTemplate;
}

@ObjectType()
export class TemplateInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  is_active: boolean;
}

@ObjectType()
export class TemplateMatchingResultSummary {
  @Field(() => ID)
  id: string;

  @Field(() => TemplateInfo)
  template: TemplateInfo;

  @Field(() => Float)
  matchingScore: number;

  @Field(() => GraphQLJSON)
  matchingFactors: any;

  @Field(() => String)
  recommendationLevel: string;

  @Field()
  createdAt: Date;
}
