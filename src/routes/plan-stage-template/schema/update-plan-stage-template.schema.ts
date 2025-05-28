import { z } from 'zod';
import { CreatePlanStageTemplateSchema } from './create-plan-stage-template.schema';

export const UpdatePlanStageTemplateSchema = CreatePlanStageTemplateSchema
    .partial()
    .extend({
        id: z.string().uuid('Invalid stage template ID'),
    });

export type UpdatePlanStageTemplateType = z.infer<typeof UpdatePlanStageTemplateSchema>;