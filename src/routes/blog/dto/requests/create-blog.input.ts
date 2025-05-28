import { Field, InputType } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { CreateBlogSchema } from '../../schema/create-blog.schema'

@InputType()
export class CreateBlogInput extends createZodDto(CreateBlogSchema) {
  @Field(() => String)
  title: string

  @Field(() => String)
  content: string
}
