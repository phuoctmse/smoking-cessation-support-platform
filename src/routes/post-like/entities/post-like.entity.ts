import { ObjectType, Field, ID } from '@nestjs/graphql'
import { SharedPost } from '../../shared-post/entities/shared-post.entity'
import { User } from '../../user/entities/user.entity'

@ObjectType()
export class PostLike {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { description: 'ID of the shared post being liked' })
  shared_post_id: string;

  @Field(() => SharedPost, { description: 'The shared post being liked' })
  shared_post: SharedPost;

  @Field(() => ID, { description: 'ID of the user who liked the post' })
  user_id: string;

  @Field(() => User, { description: 'The user who liked the post' })
  user: User;

  @Field(() => Boolean, { description: 'Indicates if the like is soft-deleted (unliked)' })
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;
}
