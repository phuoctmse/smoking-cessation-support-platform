import { ObjectType, Field, ID } from '@nestjs/graphql'
import { Badge } from '../../badge/entities/badge.entity'
import { User } from '../../user/entities/user.entity'

@ObjectType()
export class UserBadge {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  user_id: string;

  @Field(() => String)
  badge_id: string;

  @Field(() => Date)
  awarded_at: Date;

  @Field(() => Boolean)
  is_active: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => Badge)
  badge: Badge;

  @Field(() => User, { nullable: true })
  user?: User;
}