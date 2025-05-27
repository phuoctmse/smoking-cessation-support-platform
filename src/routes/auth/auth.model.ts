import { UserSchema } from 'src/shared/models/share-user.model'
import { z } from 'zod'
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '@supabase/supabase-js';

export const SignupBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  username: z.string().min(3),
  name: z.string().min(2),
  phoneNumber: z.string().optional(),
})
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password must match',
        path: ['confirmPassword'],
      })
    }
  })



export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const LoginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const LogoutResSchema = z.object({
  message: z.string(),
})

export const RefreshTokenResSchema = z.object({
  accessToken: z.string(),
})

export type SignupBodyType = z.infer<typeof SignupBodySchema>

export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResType = z.infer<typeof LoginResSchema>
export type LogoutResType = z.infer<typeof LogoutResSchema>
export type RefreshTokenResType = z.infer<typeof RefreshTokenResSchema>

@ObjectType()
export class User_Metadata {
  @Field(() => String, { nullable: true })
  role?: string;
}

@ObjectType()
export class AuthUser {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => User_Metadata, { nullable: true })
  user_metadata?: User_Metadata;

}

@ObjectType()
export class Session {
  @Field(() => String)
  access_token: string;

  @Field(() => String)
  refresh_token: string;

  @Field(() => String)
  token_type: string;

  @Field(() => String, { nullable: true })
  provider_token?: string;

  @Field(() => Number)
  expires_in: number;
}

@ObjectType()
export class AuthError {
  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => String, { nullable: true })
  status?: number;
}

@ObjectType()
export class WeakPassword {
  @Field(() => Boolean, { nullable: true })
  isWeak?: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}

@ObjectType()
export class AuthData {
  @Field(() => AuthUser, { nullable: true })
  user: AuthUser | null;

  @Field(() => Session, { nullable: true })
  session: Session | null;

  @Field(() => WeakPassword, { nullable: true })
  weakPassword?: WeakPassword | null;
}

@ObjectType()
export class AuthResponse {
  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => AuthData, { nullable: true })
  data: AuthData | null;

  @Field(() => AuthError, { nullable: true })
  error: AuthError | null;
}