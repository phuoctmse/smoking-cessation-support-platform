import { Module } from '@nestjs/common';
import { QuizResponseResolver } from './quiz-response.resolver';
import { PrismaService } from '../../shared/services/prisma.service';
import { QuizResponseService } from './quiz-response.service';
import { QuizResponseRepository } from './quiz-response.repository';
import { GuardModule } from 'src/shared/guards/guard.module';
import { QuizToProfileAIService } from '../../shared/services/quiz-to-profile-ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [GuardModule, ConfigModule],
  providers: [QuizResponseResolver, QuizResponseService, PrismaService, QuizResponseRepository, QuizToProfileAIService],
})
export class QuizResponseModule {}