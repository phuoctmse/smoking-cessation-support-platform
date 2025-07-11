import { Field, InputType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { ProfileQuizSchema } from '../../schema/profile-quiz.schema';

@InputType()
export class CreateProfileQuizInput extends createZodDto(ProfileQuizSchema) {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Boolean, { defaultValue: true })
  is_active?: boolean;
} 