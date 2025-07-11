import { Module } from '@nestjs/common';
import { QuizResponseResolver } from './quiz-response.resolver';
import { PrismaService } from '../../shared/services/prisma.service';
import { QuizResponseService } from './quiz-response.service';
import { QuizResponseRepository } from './quiz-response.repository';
import { GuardModule } from 'src/shared/guards/guard.module';

@Module({
  imports: [GuardModule],
  providers: [QuizResponseResolver, QuizResponseService, PrismaService, QuizResponseRepository],
})
export class QuizResponseModule {}