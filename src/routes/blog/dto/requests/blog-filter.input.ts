import { Field, ID, InputType } from '@nestjs/graphql'
import { IsOptional, IsUUID } from 'class-validator'

@InputType()
export class BlogFilterInput {
  @Field(() => ID, { nullable: true, description: 'Filter by author ID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;
}