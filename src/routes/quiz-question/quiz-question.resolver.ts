import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { QuizQuestion } from './entities/quiz-question.entity';
import { CreateQuizQuestionInput } from './dto/request/create-quiz-question.input';
import { UpdateQuizQuestionInput } from './dto/request/update-quiz-question.input';
import { QuizQuestionService } from './quiz-question.service';

@Resolver(() => QuizQuestion)
export class QuizQuestionResolver {
  constructor(private readonly quizQuestionService: QuizQuestionService) {}

  @Mutation(() => QuizQuestion)
  async createQuizQuestion(
    @Args('input') input: CreateQuizQuestionInput,
  ): Promise<QuizQuestion> {
    return this.quizQuestionService.createQuizQuestion(input);
  }

  @Query(() => [QuizQuestion])
  async getQuizQuestions(
    @Args('quizId', { type: () => ID }) quizId: string,
  ): Promise<QuizQuestion[]> {
    return this.quizQuestionService.findAllQuizQuestions(quizId);
  }

  @Query(() => QuizQuestion)
  async getQuizQuestion(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<QuizQuestion> {
    return this.quizQuestionService.findOneQuizQuestion(id);
  }

  @Mutation(() => QuizQuestion)
  async updateQuizQuestion(
    @Args('input') input: UpdateQuizQuestionInput,
  ): Promise<QuizQuestion> {
    return this.quizQuestionService.updateQuizQuestion(input);
  }

  @Mutation(() => QuizQuestion)
  async deleteQuizQuestion(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<QuizQuestion> {
    return this.quizQuestionService.deleteQuizQuestion(id);
  }
} 