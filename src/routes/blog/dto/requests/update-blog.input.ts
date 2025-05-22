import { Field, InputType } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { UpdateBlogSchema } from '../../model/blog.model'

@InputType()
export class UpdateBlogInput extends createZodDto(UpdateBlogSchema) {
  @Field(() => String)
  id: string

  @Field(() => String, { nullable: true })
  title?: string

  @Field(() => String, { nullable: true })
  content?: string
}
