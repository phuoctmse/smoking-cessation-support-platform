import { InputType, Int, Field, ObjectType } from '@nestjs/graphql'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
  LoginBodySchema,
  LoginResSchema,
  LogoutResSchema,
  RefreshTokenResSchema,
  SignupBodySchema,
} from './auth.model'

@InputType()
export class SignupBodyDTO extends createZodDto(SignupBodySchema) {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string

  @Field(() => String)
  user_name: string

  @Field(() => String)
  name: string

  @Field(() => String)
  confirmPassword: string
}

@InputType()
export class LoginBodyDTO extends createZodDto(LoginBodySchema) {
  @Field(() => String)
  email: string

  @Field(() => String)
  password: string
}

@ObjectType()
export class LoginResDTO extends createZodDto(LoginResSchema) {
  @Field(() => String)
  accessToken: string

  @Field(() => String)
  refreshToken: string
}

@ObjectType()
export class LogoutResDTO extends createZodDto(LogoutResSchema) {
  @Field(() => String)
  message: string
}

@ObjectType()
export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {
  @Field(() => String)
  accessToken: string
}
