import { Field, ID, InputType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { QuizResponseSchema } from '../../schema/quiz-response.schema';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateQuizResponseInput extends createZodDto(QuizResponseSchema) {
    @Field(() => ID)
    question_id: string;

    @Field(() => ID, { nullable: true })
    attempt_id?: string;

    @Field(() => GraphQLJSON)
    answer: any;
}

