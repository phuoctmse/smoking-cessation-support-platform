import { Field, InputType } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { CreateBlogSchema } from '../../model/blog.model'

@InputType()
export class CreateBlogInput extends createZodDto(CreateBlogSchema) {
  @Field(() => String)
  title: string

  @Field(() => String)
  content: string
}
