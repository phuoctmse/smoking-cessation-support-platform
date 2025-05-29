import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class User_Metadata {
  @Field(() => String, { nullable: true })
  role?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  user_name?: string;
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