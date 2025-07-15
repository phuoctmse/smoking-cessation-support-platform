import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateProfileQuizInput } from './dto/request/create-profile-quiz.input';
import { QuestionType } from 'src/shared/constants/question-type.constant';
import { QuestionType as PrismaQuestionType } from '@prisma/client';

@Injectable()
export class ProfileQuizRepository {
  constructor(private readonly prisma: PrismaService) { }

  // Transform Prisma QuestionType to our custom QuestionType
  private transformQuestionType(prismaType: PrismaQuestionType): QuestionType {
    return prismaType as unknown as QuestionType;
  }

  // Transform questions array to fix QuestionType enum
  private transformQuestions(questions: any[]): any[] {
    return questions.map(question => ({
      ...question,
      question_type: this.transformQuestionType(question.question_type)
    }));
  }

  // Transform ProfileQuiz with questions
  private transformProfileQuiz(quiz: any): any {
    if (quiz.questions) {
      return {
        ...quiz,
        questions: this.transformQuestions(quiz.questions)
      };
    }
    return quiz;
  }

  async create(input: CreateProfileQuizInput) {
    const { questions, ...quizData } = input;

    const result = await this.prisma.profileQuiz.create({
      data: {
        ...quizData,
        questions: {},
        attempts: {
        }
      },
      include: {
        questions: true,
        attempts: true
      },
    });

    return this.transformProfileQuiz(result);
  }

  async findAll() {
    const results = await this.prisma.profileQuiz.findMany({
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return results.map(result => this.transformProfileQuiz(result));
  }

  async findOne(id: string) {
    const result = await this.prisma.profileQuiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return result ? this.transformProfileQuiz(result) : null;
  }

  async update(id: string, input: Partial<CreateProfileQuizInput>) {
    const { questions, ...quizData } = input;

    const result = await this.prisma.profileQuiz.update({
      where: { id },
      data: {
        ...quizData,
        questions: {},
        attempts: {}
      },
      include: {
        questions: true,
        attempts: true
      },
    });

    return this.transformProfileQuiz(result);
  }

  async delete(id: string) {
    const result = await this.prisma.profileQuiz.delete({
      where: { id },
      include: {
        questions: true,
        attempts: true
      },
    });

    return this.transformProfileQuiz(result);
  }
}