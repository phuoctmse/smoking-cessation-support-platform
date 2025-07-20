import { z } from "zod";
import { QuizResponseSchema } from "../quiz-response/schema/quiz-response.schema";

export const QuizAttemptSchema = z.object({
    id: z.string(),
    quiz_id: z.string(),
    user_id: z.string(),
    member_profile_id: z.string(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']),
    started_at: z.date(),
    completed_at: z.date().optional(),
    created_at: z.date(),
    updated_at: z.date(),
    responses: z.array(QuizResponseSchema),
})

export type QuizAttemptType = z.infer<typeof QuizAttemptSchema>