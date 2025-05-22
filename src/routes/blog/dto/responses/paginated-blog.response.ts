import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Blog } from '../../entities/blog.entity'

@ObjectType()
export class PaginatedBlogsResponse {
  @Field(() => [Blog])
  data: Blog[]

  @Field(() => Int)
  total: number

  @Field(() => Int)
  page: number

  @Field(() => Int)
  limit: number

  @Field(() => Boolean)
  hasNext: boolean
}
