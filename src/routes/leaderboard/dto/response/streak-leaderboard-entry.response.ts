import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class StreakLeaderboardEntry {
  @Field(() => Int)
  rank: number;

  @Field()
  userId: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  name?: string;

  @Field(() => Int)
  streak: number;
}