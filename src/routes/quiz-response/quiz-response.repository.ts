import { Injectable } from '@nestjs/common';
import { CreateQuizResponseInput } from './dto/request/create-quiz-response.input';
import { QuizResponse } from './entities/quiz-response.entity';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class QuizResponseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateQuizResponseInput): Promise<QuizResponse> {
    // Nếu không có attempt_id, tìm hoặc tạo quiz attempt mới
    let attemptId = input.attempt_id;
    
    if (!attemptId) {
      // Lấy quiz_id từ question
      const question = await this.prisma.quizQuestion.findUnique({
        where: { id: input.question_id },
        select: { quiz_id: true }
      });

      if (!question) {
        throw new Error('Question not found');
      }

      // Tìm quiz attempt đang IN_PROGRESS của user cho quiz này
      let attempt = await this.prisma.quizAttempt.findFirst({
        where: {
          quiz_id: question.quiz_id,
          user_id: input.user_id,
          member_profile_id: input.member_profile_id,
          status: 'IN_PROGRESS'
        }
      });

      // Nếu không có, tạo mới
      if (!attempt) {
        attempt = await this.prisma.quizAttempt.create({
          data: {
            quiz_id: question.quiz_id,
            user_id: input.user_id,
            member_profile_id: input.member_profile_id,
            status: 'IN_PROGRESS'
          }
        });
      }

      attemptId = attempt.id;
    }

    // Tạo quiz response
    const response = await this.prisma.quizResponse.create({
      data: {
        question_id: input.question_id,
        attempt_id: attemptId,
        answer: input.answer,
      },
    });

    // Kiểm tra và hoàn thành quiz attempt nếu cần
    await this.completeQuizAttempt(attemptId);

    return response;
  }

  async findByAttemptId(attemptId: string): Promise<QuizResponse[]> {
    return this.prisma.quizResponse.findMany({
      where: { attempt_id: attemptId },
    });
  }

  async validateResponse(questionId: string, answer: any): Promise<boolean> {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    // Implement validation logic based on question.validation_rule
    return true; // Placeholder
  }

  async completeQuizAttempt(attemptId: string): Promise<void> {
    // Kiểm tra xem đã trả lời hết câu hỏi trong quiz chưa
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              where: { is_required: true }
            }
          }
        },
        responses: true
      }
    });

    if (!attempt) {
      throw new Error('Quiz attempt not found');
    }

    // Đếm số câu hỏi bắt buộc và số câu đã trả lời
    const requiredQuestions = attempt.quiz.questions.length;
    const answeredQuestions = attempt.responses.length;

    // Nếu đã trả lời hết câu hỏi bắt buộc, hoàn thành quiz
    if (answeredQuestions >= requiredQuestions) {
      await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          completed_at: new Date()
        }
      });
    }
  }
}