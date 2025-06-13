import {Field, InputType} from '@nestjs/graphql'

@InputType()
export class BadgeTypeFiltersInput {
  @Field(() => String, { nullable: true })
  name?: string;
}