import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { QuizResponseService } from './quiz-response.service';
import { QuizResponse } from './entities/quiz-response.entity';
import { CreateQuizResponseInput } from './dto/request/create-quiz-response.input';
import { StartQuizInput } from './dto/request/start-quiz.input';
import { SubmitQuizInput } from './dto/request/submit-quiz.input';
import { SubmitQuizResponse } from './dto/response/submit-quiz.response';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UserType } from '../user/schema/user.schema';
import { QuizAttempt } from '../quiz-attempt/quiz-attempt.entity';

@Resolver(() => QuizResponse)
@UseGuards(JwtAuthGuard)
export class QuizResponseResolver {
    constructor(private readonly quizResponseService: QuizResponseService) { }

    @UseGuards(RolesGuard)
    @Roles('MEMBER')
    @Mutation(() => QuizAttempt)
    async startQuiz(
        @Args('input') input: StartQuizInput,
        @CurrentUser() currentUser: UserType
    ): Promise<QuizAttempt> {
        return this.quizResponseService.startQuiz(input, currentUser);
    }

    @UseGuards(RolesGuard)
    @Roles('MEMBER')
    @Mutation(() => SubmitQuizResponse)
    async submitQuiz(
        @Args('input') input: SubmitQuizInput,
        @CurrentUser() currentUser: UserType
    ): Promise<SubmitQuizResponse> {
        return this.quizResponseService.submitQuiz(input, currentUser);
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