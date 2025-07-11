import { Field, ID, ObjectType } from '@nestjs/graphql';
import { QuizResponse } from '../quiz-response/entities/quiz-response.entity';
import { QuizStatus } from '@prisma/client';

@ObjectType()
export class QuizAttempt {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    quiz_id: string;

    @Field(() => ID)
    user_id: string;

    @Field(() => ID)
    member_profile_id: string;

    @Field(() => QuizStatus)
    status: QuizStatus;

    @Field(() => Date)
    started_at: Date;

    @Field(() => Date)
    completed_at: Date;

    @Field(() => [QuizResponse])
    responses: QuizResponse[];

    @Field(() => Date)
    created_at: Date;

    @Field(() => Date)
    updated_at: Date;

}