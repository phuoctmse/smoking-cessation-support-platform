import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator'

@InputType()
export class UpdateSharedPostInput {
  @Field(() => String, { nullable: true, description: 'New caption for the post' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
