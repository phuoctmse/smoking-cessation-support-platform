import { ObjectType } from '@nestjs/graphql'
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response'
import { Feedback } from '../../entities/feedback.entity'

@ObjectType()
export class PaginatedFeedbacksResponse extends PaginatedResponse(Feedback) {}