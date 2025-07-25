import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class QuizResponse {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    question_id: string;

    @Field(() => ID)
    attempt_id: string;

    @Field(() => GraphQLJSON)
    answer: any;

    @Field(() => Int)
    order: number;

    @Field()
    created_at: Date;

    @Field()
    updated_at: Date;
}