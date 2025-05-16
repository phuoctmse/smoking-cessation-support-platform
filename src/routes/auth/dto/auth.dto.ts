import { InputType, Int, Field, ObjectType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(3).max(255),
  username: z.string().min(3).max(100),
  name: z.string().min(3).max(100),
})

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(3).max(255),
})

@InputType()
export class SignupInput extends createZodDto(signupSchema) {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  name: string;
}

@InputType()
export class LoginInput extends createZodDto(loginSchema) {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

const loginResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.string(),
})

export class LoginResponse extends createZodDto(loginResponseSchema)
{}