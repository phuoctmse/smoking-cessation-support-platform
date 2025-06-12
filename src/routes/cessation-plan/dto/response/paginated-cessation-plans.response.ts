import { ObjectType } from '@nestjs/graphql';
import { CessationPlan } from '../../entities/cessation-plan.entity';
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response';

@ObjectType()
export class PaginatedCessationPlansResponse extends PaginatedResponse(CessationPlan) {}