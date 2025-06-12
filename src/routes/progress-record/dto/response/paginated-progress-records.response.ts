import { ObjectType } from '@nestjs/graphql'
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response'
import { ProgressRecord } from '../../entities/progress-record.entity'

@ObjectType()
export class PaginatedProgressRecordsResponse extends PaginatedResponse(ProgressRecord) {}