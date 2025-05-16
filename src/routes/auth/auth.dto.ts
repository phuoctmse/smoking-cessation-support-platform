import { InputType, Int, Field, ObjectType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { LoginBodySchema, LoginResSchema, SignupBodySchema, SignupResSchema } from './auth.model';

@InputType()
export class SignupInput extends createZodDto(SignupBodySchema) {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  confirmPassword: string;
}

@InputType()
export class LoginInput extends createZodDto(LoginBodySchema) {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

export class SignupBodyDTO extends createZodDto(SignupBodySchema) { }
export class SignupResDTO extends createZodDto(SignupResSchema) { }
export class LoginBodyDTO extends createZodDto(LoginBodySchema) { }
export class LoginResDTO extends createZodDto(LoginResSchema) { }