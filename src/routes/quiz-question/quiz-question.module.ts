import { Module } from '@nestjs/common';
import { QuizQuestionResolver } from './quiz-question.resolver';
import { QuizQuestionRepository } from './quiz-question.repository';
import { QuizQuestionService } from './quiz-question.service';
import { GuardModule } from 'src/shared/guards/guard.module';

@Module({
  imports: [GuardModule],
  providers: [QuizQuestionResolver, QuizQuestionRepository, QuizQuestionService],
})
export class QuizQuestionModule {} 