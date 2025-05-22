import { ObjectType } from '@nestjs/graphql';
import { Blog } from '../../entities/blog.entity';
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response'

@ObjectType()
export class PaginatedBlogsResponse extends PaginatedResponse(Blog) {}
