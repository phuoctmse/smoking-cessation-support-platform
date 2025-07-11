import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { QuizResponseService } from './quiz-response.service';
import { QuizResponse } from './entities/quiz-response.entity';
import { CreateQuizResponseInput } from './dto/request/create-quiz-response.input';

@Resolver(() => QuizResponse)
export class QuizResponseResolver {
    constructor(private readonly quizResponseService: QuizResponseService) { }

    @Mutation(() => QuizResponse)
    async createQuizResponse(
        @Args('input') input: CreateQuizResponseInput,
    ): Promise<QuizResponse> {
        return this.quizResponseService.create(input);
    }

    @Query(() => [QuizResponse])
    async getQuizResponsesByAttempt(
        @Args('attemptId') attemptId: string,
    ): Promise<QuizResponse[]> {
        return this.quizResponseService.findByAttemptId(attemptId);
    }

    @Mutation(() => Boolean)
    async validateQuizResponse(
        @Args('questionId') questionId: string,
        @Args('answer', { type: () => GraphQLJSON }) answer: any,
    ): Promise<boolean> {
        return this.quizResponseService.validateResponse(questionId, answer);
    }
}