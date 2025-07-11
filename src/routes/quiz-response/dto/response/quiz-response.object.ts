import { Field, ID, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class QuizResponseObject {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    question_id: string;

    @Field(() => ID)
    attempt_id: string;

    @Field(() => GraphQLJSON)
    answer: {
        text: string;
        number: number;
        boolean: boolean;
        date: Date;
        select: string;
    };

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}