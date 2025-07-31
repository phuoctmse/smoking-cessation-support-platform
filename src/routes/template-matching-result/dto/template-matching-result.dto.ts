import { InputType, Field, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class CreateTemplateMatchingResultInput {
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
}

@InputType()
export class UpdateTemplateMatchingResultInput {
  @Field(() => Float, { nullable: true })
  matching_score?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  matching_factors?: any;

  @Field(() => String, { nullable: true })
  recommendation_level?: string;
}
