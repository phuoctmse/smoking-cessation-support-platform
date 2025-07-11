import { QuizAttemptSchema } from "src/routes/quiz-attempt/quiz-attempt.schema";
import { QuizQuestionSchema } from "src/routes/quiz-question/schema/quiz-question.schema";
import { z } from "zod";

export const ProfileQuizSchema = z.object({
    title: z.string(),
    description: z.string().max(255, 'Description must be less than 255 characters').optional(),
    is_active: z.boolean().default(true),
    questions: z.array(QuizQuestionSchema).optional(),
    attempts: z.array(QuizAttemptSchema).optional(),
    created_at: z.date().optional(),
    updated_at: z.date().optional(),
})

export type ProfileQuizType = z.infer<typeof ProfileQuizSchema>