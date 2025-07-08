import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class ErrorTimeBucket {
  @Field()
  key: number;

  @Field()
  doc_count: number;

  @Field()
  key_as_string: string;
}

@ObjectType()
class ErrorServiceBucket {
  @Field()
  key: string;

  @Field()
  doc_count: number;
}

@ObjectType()
export class ErrorStats {
  @Field(() => [ErrorTimeBucket])
  errorOverTime: ErrorTimeBucket[];

  @Field(() => [ErrorServiceBucket])
  errorByService: ErrorServiceBucket[];
} 