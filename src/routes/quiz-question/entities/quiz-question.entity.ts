import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { QuestionType } from 'src/shared/constants/question-type.constant';

@ObjectType()
export class QuizQuestion {
    @Field(() => ID)
    id: string;

    @Field(() => String)
    quiz_id: string;

    @Field(() => String)
    question_text: string;

    @Field({ nullable: true })
    description?: string;

    @Field(() => QuestionType)
    question_type: QuestionType;

    @Field(() => GraphQLJSON, { nullable: true })
    options?: any;

    @Field(() => Number)
    order: number;

    @Field(() => Boolean)
    is_required: boolean;

    @Field(() => GraphQLJSON, { nullable: true })
    validation_rule?: any;

    @Field(() => Date)
    created_at: Date;

    @Field(() => Date)
    updated_at: Date;
} 