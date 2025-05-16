import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Role, Status } from 'src/shared/constants/enum';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  email: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  avatar_url?: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  role: Role;

  @Field(() => String)
  status: Status;

  @Field(() => Int, { nullable: true })
  cigarettes_per_day?: number;

  @Field(() => Int, { nullable: true })
  sessions_per_day?: number;

  @Field(() => Int, { nullable: true })
  price_per_pack?: number;

  @Field(() => Date, { nullable: true })
  recorded_at?: Date;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}