import { ObjectType, Field, ID } from '@nestjs/graphql'
import { SharedPost } from '../../shared-post/entities/shared-post.entity'
import { User } from '../../user/entities/user.entity'

@ObjectType()
export class PostComment {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { description: 'ID of the shared post being commented on' })
  shared_post_id: string;

  @Field(() => SharedPost, { description: 'The shared post being commented on' })
  shared_post: SharedPost;

  @Field(() => ID, { description: 'ID of the user who wrote the comment' })
  user_id: string;

  @Field(() => User, { description: 'The user who wrote the comment' })
  user: User;

  @Field(() => ID, { nullable: true, description: 'ID of the parent comment if this is a reply' })
  parent_comment_id?: string | null;

  @Field(() => PostComment, { nullable: true, description: 'The parent comment if this is a reply' })
  parent_comment?: PostComment | null;

  @Field(() => [PostComment], { nullable: 'itemsAndList', description: 'Replies to this comment' })
  replies?: PostComment[];

  @Field(() => String)
  content: string;

  @Field(() => Boolean, { description: 'Indicates if the comment is soft-deleted' })
  is_deleted: boolean;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}