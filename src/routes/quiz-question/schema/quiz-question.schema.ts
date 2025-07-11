import { QuestionType } from "src/shared/constants/question-type.constant";
import { z } from "zod";

export const QuizQuestionSchema = z.object({
    question_text: z.string(),
    description: z.string().optional(),
    question_type: z.nativeEnum(QuestionType),
    options: z.array(z.string()).optional(),
    order: z.number(),
    is_required: z.boolean().optional(),
})