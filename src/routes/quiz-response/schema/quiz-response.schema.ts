import { z } from "zod";

export const QuizResponseSchema = z.object({
    id: z.string(),
    question_id: z.string(),
    attempt_id: z.string(),
    answer: z.object({
        text: z.string().optional(),
        number: z.number().optional(),
        boolean: z.boolean().optional(),
        date: z.date().optional(),
        select: z.string().optional(),
    }),
})

export type QuizResponseType = z.infer<typeof QuizResponseSchema>