import { Field, InputType } from '@nestjs/graphql';
import { PlanStageStatus } from '@prisma/client';

@InputType()
export class PlanStageFiltersInput {
    @Field(() => String, { nullable: true })
    plan_id?: string;

    @Field(() => PlanStageStatus, { nullable: true })
    status?: PlanStageStatus;

    @Field(() => String, { nullable: true })
    template_stage_id?: string;

    @Field(() => String, { nullable: true })
    user_id?: string;

    @Field(() => Date, { nullable: true })
    start_date?: Date;

    @Field(() => Date, { nullable: true })
    end_date?: Date;
}