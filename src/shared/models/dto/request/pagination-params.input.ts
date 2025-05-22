import { Field, InputType, Int } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { PaginationParamsSchema } from '../../pagination.model'
import { DEFAULT_LIMIT, DEFAULT_PAGE, DEFAULT_SORT_ORDER } from '../../../constants/pagination.constant'

@InputType()
export class PaginationParamsInput extends createZodDto(PaginationParamsSchema) {
  @Field(() => Int, { defaultValue: DEFAULT_PAGE })
  page: number;

  @Field(() => Int, { defaultValue: DEFAULT_LIMIT })
  limit: number;

  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => String, { defaultValue: 'created_at' })
  orderBy: string;

  @Field(() => String, { defaultValue: DEFAULT_SORT_ORDER })
  sortOrder: 'asc' | 'desc';
}