import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AIRecommendationReasoning {
  @Field(() => [String])
  matchingFactors: string[];

  @Field(() => [String])
  considerations: string[];

  @Field(() => [String])
  risks: string[];

  @Field(() => [String])
  suggestions: string[];
}

@ObjectType()
export class AIRecommendationOutput {
  @Field(() => String)
  recommendedTemplate: string;

  @Field(() => Number)
  confidence: number;

  @Field(() => AIRecommendationReasoning)
  reasoning: AIRecommendationReasoning;

  @Field(() => [String])
  alternativeTemplates: string[];
} 