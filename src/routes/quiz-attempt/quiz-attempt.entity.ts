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

    @Field(() => Date, { nullable: true })
    started_at: Date;

    @Field(() => Date, { nullable: true })
    completed_at: Date;

    @Field(() => [QuizResponse])
    responses: QuizResponse[];

    @Field(() => Date, { nullable: true })
    created_at: Date;

    @Field(() => Date, { nullable: true })
    updated_at: Date;

}