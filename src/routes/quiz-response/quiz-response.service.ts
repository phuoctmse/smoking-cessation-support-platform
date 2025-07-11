import { Injectable } from '@nestjs/common';
import { QuizResponseRepository } from './quiz-response.repository';
import { CreateQuizResponseInput } from './dto/request/create-quiz-response.input';
import { QuizResponse } from './entities/quiz-response.entity';

@Injectable()
export class QuizResponseService {
  constructor(private readonly quizResponseRepo: QuizResponseRepository) {}

  async create(input: CreateQuizResponseInput): Promise<QuizResponse> {
    // Validate input
    // Transform data if needed
    return this.quizResponseRepo.create(input);
  }

  async findByAttemptId(attemptId: string): Promise<QuizResponse[]> {
    return this.quizResponseRepo.findByAttemptId(attemptId);
  }

  async validateResponse(questionId: string, answer: any): Promise<boolean> {
    // Implement validation logic based on question type and rules
    return this.quizResponseRepo.validateResponse(questionId, answer);
  }
}