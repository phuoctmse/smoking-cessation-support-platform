import { ArgsType, Field, Int } from '@nestjs/graphql'

@ArgsType()
class PaginationArgs {
  @Field(() => Int)
  offset: number = 0;

  @Field(() => Int)
  limit: number = 10;
}