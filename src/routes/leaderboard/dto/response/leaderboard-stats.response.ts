import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class LeaderboardStats {
  @Field(() => Int)
  totalUsers: number;

  @Field()
  averageStreak: number;

  @Field(() => Int)
  topStreak: number;
}