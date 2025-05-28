import { ObjectType } from '@nestjs/graphql';
import { CessationPlanTemplate } from '../../entities/cessation-plan-template.entity';
import { PaginatedResponse } from '../../../../shared/models/dto/response/paginated-response'

@ObjectType()
export class PaginatedCessationPlanTemplatesResponse extends PaginatedResponse(CessationPlanTemplate) {}