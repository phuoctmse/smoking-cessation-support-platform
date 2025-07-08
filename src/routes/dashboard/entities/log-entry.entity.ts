import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class LogEntry {
  @Field()
  timestamp: Date;

  @Field()
  level: string;

  @Field()
  message: string;

  @Field()
  service: string;

  @Field(() => Float, { nullable: true })
  score?: number;

  @Field(() => String, { nullable: true })
  traceId?: string;

  @Field(() => String, { nullable: true })
  userId?: string;

  @Field(() => String, { nullable: true })
  path?: string;

  @Field(() => String, { nullable: true })
  method?: string;
} 