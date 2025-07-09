import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { RoleNameEnum, StatusEnum } from 'src/shared/enums/graphql-enums';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class MemberProfileInput {
  @Field(() => Int, { nullable: true })
  cigarettes_per_day?: number;

  @Field(() => Int, { nullable: true })
  sessions_per_day?: number;

  @Field(() => Int, { nullable: true })
  price_per_pack?: number;

  @Field(() => Int, { nullable: true })
  smoking_years?: number;

  @Field(() => String, { nullable: true })
  brand_preference?: string;

  @Field(() => Float, { nullable: true })
  nicotine_level?: number;

  @Field(() => [String], { nullable: true })
  health_conditions?: string[];

  @Field(() => [String], { nullable: true })
  allergies?: string[];

  @Field(() => [String], { nullable: true })
  medications?: string[];

  @Field(() => String, { nullable: true })
  quit_motivation?: string;

  @Field(() => Int, { nullable: true })
  previous_attempts?: number;

  @Field(() => [String], { nullable: true })
  preferred_support?: string[];

  @Field(() => Int, { nullable: true })
  stress_level?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  daily_routine?: any;

  @Field(() => Boolean, { nullable: true })
  social_support?: boolean;

  @Field(() => [String], { nullable: true })
  trigger_factors?: string[];
}

@InputType()
export class CoachProfileInput {
  @Field(() => Int, { nullable: true })
  experience_years?: number;

  @Field(() => [String], { nullable: true })
  specializations?: string[];

  @Field(() => [String], { nullable: true })
  certifications?: string[];

  @Field(() => String, { nullable: true })
  education?: string;

  @Field(() => String, { nullable: true })
  professional_bio?: string;

  @Field(() => Float, { nullable: true })
  success_rate?: number;

  @Field(() => Int, { nullable: true })
  total_clients?: number;

  @Field(() => Float, { nullable: true })
  average_rating?: number;

  @Field(() => Int, { nullable: true })
  total_sessions?: number;

  @Field(() => String, { nullable: true })
  approach_description?: string;
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String, { nullable: true })
  phoneNumber?: string;

  @Field(() => String, { nullable: true })
  avatar_url?: string;

  @Field(() => RoleNameEnum)
  role: RoleNameEnum;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => MemberProfileInput, { nullable: true })
  memberProfile?: MemberProfileInput;

  @Field(() => CoachProfileInput, { nullable: true })
  coachProfile?: CoachProfileInput;
}