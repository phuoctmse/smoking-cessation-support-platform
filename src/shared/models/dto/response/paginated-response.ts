import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PaginatedResponseType } from '../../pagination.model'

export function PaginatedResponse<T>(itemType: Type<T>): Type<PaginatedResponseType<T>> {
  @ObjectType({ isAbstract: true })
  class PaginatedResponseClass implements PaginatedResponseType<T> {
    @Field(() => [itemType])
    data: T[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Boolean)
    hasNext: boolean;
  }

  return PaginatedResponseClass as Type<PaginatedResponseType<T>>;
}