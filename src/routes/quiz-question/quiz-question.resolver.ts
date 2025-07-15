import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { QuizQuestion } from './entities/quiz-question.entity';
import { CreateQuizQuestionInput } from './dto/request/create-quiz-question.input';
import { UpdateQuizQuestionInput } from './dto/request/update-quiz-question.input';
import { QuizQuestionResponse, DeleteQuizQuestionResponse } from './dto/response/quiz-question-response.dto';
import { QuizQuestionService } from './quiz-question.service';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Resolver(() => QuizQuestion)
@UseGuards(JwtAuthGuard)
export class QuizQuestionResolver {
  constructor(private readonly quizQuestionService: QuizQuestionService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Mutation(() => QuizQuestion)
  async createQuizQuestion(
    @Args('input') input: CreateQuizQuestionInput,
  ): Promise<QuizQuestion> {
    return this.quizQuestionService.createQuizQuestion(input);
  }

  @Query(() => [QuizQuestion])
  async getQuizQuestionsInProfileQuiz(
    @Args('profileQuizId', { type: () => ID }) profileQuizId: string,
  ): Promise<QuizQuestion[]> {
    return this.quizQuestionService.findAllQuizQuestions(profileQuizId);
  }

  @Query(() => QuizQuestion)
  async getQuizQuestion(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<QuizQuestion> {
    return this.quizQuestionService.findOneQuizQuestion(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Mutation(() => QuizQuestionResponse)
  async updateQuizQuestion(
    @Args('input') input: UpdateQuizQuestionInput,
  ): Promise<QuizQuestionResponse> {
    const updatedQuestion = await this.quizQuestionService.updateQuizQuestion(input);
    return {
      message: 'Quiz question updated successfully',
      data: updatedQuestion
    };
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Mutation(() => DeleteQuizQuestionResponse)
  async deleteQuizQuestion(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DeleteQuizQuestionResponse> {
    await this.quizQuestionService.deleteQuizQuestion(id);
    return {
      message: 'Quiz question deleted successfully',
      success: true
    };
  }
} 