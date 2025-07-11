import { registerEnumType } from "@nestjs/graphql";
import { QuestionType } from '@prisma/client';

registerEnumType(QuestionType, {
    name: 'QuestionType',
    description: 'The type of quiz question',
})

export { QuestionType };