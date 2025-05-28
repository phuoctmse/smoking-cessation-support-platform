import { Field, ID, ObjectType } from '@nestjs/graphql'
import { User } from '../../user/entities/user.entity'
import { BlogType } from '../schema/blog.schema'

@ObjectType()
export class Blog implements BlogType {
  @Field(() => ID)
  id: string

  @Field(() => String)
  title: string

  @Field(() => String)
  slug: string

  @Field(() => String)
  content: string

  @Field(() => String, { nullable: true })
  cover_image?: string

  @Field(() => String, { nullable: true })
  cover_image_path?: string

  @Field(() => Boolean)
  is_deleted: boolean

  @Field(() => Date)
  created_at: Date

  @Field(() => Date)
  updated_at: Date

  @Field(() => String)
  author_id: string

  @Field(() => User)
  author: User
}