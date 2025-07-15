import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuizResponseInput } from './dto/request/create-quiz-response.input';
import { QuizResponse } from './entities/quiz-response.entity';
import { PrismaService } from 'src/shared/services/prisma.service';
import { UserType } from '../user/schema/user.schema';
import { QuizAttempt } from '../quiz-attempt/quiz-attempt.entity';
import { QuizStatus } from 'src/shared/constants/question-type.constant';

@Injectable()
export class QuizResponseRepository {
  constructor(private readonly prisma: PrismaService) { }

  // Tạo quiz attempt mới
  async createQuizAttempt(quizId: string, userId: string, memberProfileId: string): Promise<QuizAttempt> {
    const quiz_attempt = await this.prisma.quizAttempt.create({
      data: {
        quiz_id: quizId,
        user_id: userId,
        member_profile_id: memberProfileId,
        status: QuizStatus.IN_PROGRESS,
        started_at: new Date()
      },
      include: {
        responses: true
      }
    });

    return quiz_attempt
  }

  // Tìm quiz by ID
  async findQuizById(quizId: string): Promise<any> {
    return this.prisma.profileQuiz.findUnique({
      where: { id: quizId }
    });
  }

  // Tìm member profile by ID
  async findMemberProfileById(memberProfileId: string): Promise<any> {
    return this.prisma.memberProfile.findUnique({
      where: { id: memberProfileId }
    });
  }

  // Tìm quiz attempt với details
  async findQuizAttemptWithDetails(attemptId: string): Promise<any> {
    return this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true
          }
        },
        member_profile: true
      }
    });
  }

  // Bulk insert quiz responses và update attempt trong transaction
  async submitQuizTransaction(attemptId: string, responses: any[], memberProfileId: string, memberProfileData: any): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Update attempt status
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          completed_at: new Date()
        }
      });

      // 2. Bulk insert quiz responses
      const responseData = responses.map(response => ({
        id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question_id: response.question_id,
        attempt_id: attemptId,
        answer: JSON.stringify(response.answer),
        created_at: new Date(),
        updated_at: new Date()
      }));

      await prisma.quizResponse.createMany({
        data: responseData
      });

      // 3. Update member profile
      await prisma.memberProfile.update({
        where: { id: memberProfileId },
        data: {
          ...memberProfileData,
          recorded_at: new Date()
        }
      });

      // 4. Return created responses
      return prisma.quizResponse.findMany({
        where: { attempt_id: attemptId }
      });
    });
  }

  // Legacy method - tạo single response
  async create(input: CreateQuizResponseInput, currentUser: UserType): Promise<QuizResponse> {
    let attemptId = input.attempt_id;

    if (!attemptId) {
      const question = await this.prisma.quizQuestion.findUnique({
        where: { id: input.question_id },
        select: { quiz_id: true }
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      let attempt = await this.prisma.quizAttempt.findFirst({
        where: {
          quiz_id: question.quiz_id,
          user_id: currentUser.id,
          status: 'IN_PROGRESS'
        }
      });

      if (!attempt) {
        // Cần member_profile_id từ currentUser hoặc tạo default
        const memberProfile = await this.prisma.memberProfile.findFirst({
          where: { user_id: currentUser.id }
        });
        
        const memberProfileId = memberProfile?.id || 'default-profile-id';
        attempt = await this.createQuizAttempt(question.quiz_id, currentUser.id, memberProfileId);
      }

      attemptId = attempt.id;
    }

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