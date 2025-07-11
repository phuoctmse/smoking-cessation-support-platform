import { Module } from '@nestjs/common';
import { ProfileQuizResolver } from './profile-quiz.resolver';
import { ProfileQuizRepository } from './profile-quiz.repository';
import { QuizQuestionModule } from '../quiz-question/quiz-question.module';
import { ProfileQuizService } from './profile-quiz.service';
import { GuardModule } from 'src/shared/guards/guard.module';

@Module({
  imports: [QuizQuestionModule, GuardModule],
  providers: [ProfileQuizResolver, ProfileQuizRepository, ProfileQuizService],
})
export class ProfileQuizModule {} 