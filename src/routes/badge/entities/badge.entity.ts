import { ObjectType, Field, Int, ID } from '@nestjs/graphql'
import { BadgeType } from '../../badge-type/entities/badge-type.entity'

@ObjectType()
export class Badge {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  icon_url?: string;

  @Field(() => BadgeType)
  badge_type: BadgeType;

  @Field(() => String, { nullable: true, description: 'JSON string containing badge requirements' })
  requirements?: string;

  @Field(() => Boolean)
  is_active: boolean;

  @Field(() => Int)
  sort_order: number;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}