import { Field, InputType, Int } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { BlogQueryParamsSchema } from '../../model/blog.model'

@InputType()
export class GetBlogArgs extends createZodDto(BlogQueryParamsSchema) {
  @Field(() => Int, { defaultValue: 1 })
  page: number

  @Field(() => Int, { defaultValue: 10 })
  limit: number

  @Field(() => String, { nullable: true })
  search?: string

  @Field(() => String, { defaultValue: 'created_at' })
  orderBy: 'created_at' | 'updated_at' | 'title'

  @Field(() => String, { defaultValue: 'desc' })
  sortOrder: 'asc' | 'desc'
}
