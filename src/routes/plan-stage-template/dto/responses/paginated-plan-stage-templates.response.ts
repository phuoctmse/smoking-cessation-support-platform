import { ObjectType } from '@nestjs/graphql'
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response'
import { PlanStageTemplate } from '../../entities/plan-stage-template.entity'

@ObjectType()
export class PaginatedPlanStageTemplatesResponse extends PaginatedResponse(PlanStageTemplate) {}