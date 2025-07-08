import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class SystemStats {
  @Field()
  clusterStatus: string;

  @Field(() => Int)
  numberOfNodes: number;

  @Field(() => Int)
  activeShards: number;

  @Field(() => Int)
  totalIndices: number;

  @Field(() => Int)
  totalDocuments: number;

  @Field(() => Float)
  totalSize: number;
} 