import { ObjectType } from '@nestjs/graphql';
import { PlanStage } from '../../entities/plan-stage.entity';
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response';

@ObjectType()
export class PaginatedPlanStagesResponse extends PaginatedResponse(PlanStage) {}