import { ObjectType, Field, Int, ID } from '@nestjs/graphql'
import { User } from '../../user/entities/user.entity'
import { CessationPlanTemplate } from '../../cessation-plan-template/entities/cessation-plan-template.entity'
import { FeedbackType } from '../schema/feedback.schema'

@ObjectType()
export class Feedback implements FeedbackType {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true, description: "The ID of the user who gave feedback. Null if anonymous." })
  user_id?: string | null;

  @Field(() => String)
  template_id: string;

  @Field(() => Int)
  rating: number;

  @Field(() => String)
  content: string;

  @Field(() => Boolean)
  is_anonymous: boolean;

  @Field(() => Boolean)
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => User, { nullable: true, description: "User who gave the feedback. Null if anonymous." })
  user?: User | null;

  @Field(() => CessationPlanTemplate)
  template: CessationPlanTemplate;
}
