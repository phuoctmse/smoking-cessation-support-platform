import { ObjectType, Field, Int, ID } from '@nestjs/graphql'
import { UserBadge } from '../../user-badge/entities/user-badge.entity'

@ObjectType()
export class SharedPost {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'ID of the UserBadge being shared' })
  user_badge_id: string;

  @Field(() => UserBadge, { description: 'The UserBadge being shared' })
  user_badge: UserBadge;

  @Field(() => String, { nullable: true, description: 'Caption for the shared post' })
  caption?: string;

  @Field(() => Int, { defaultValue: 0, description: 'Number of likes on this post' })
  likes_count: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of comments on this post' })
  comments_count: number;

  @Field(() => Boolean, { description: 'Indicates if the post is soft-deleted' })
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}
