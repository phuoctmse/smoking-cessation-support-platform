import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateProfileQuizInput } from './dto/request/create-profile-quiz.input';

@Injectable()
export class ProfileQuizRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(input: CreateProfileQuizInput) {
    const { questions, ...quizData } = input;

    return this.prisma.profileQuiz.create({
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
  }

  async findAll() {
    return this.prisma.profileQuiz.findMany({
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.profileQuiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, input: Partial<CreateProfileQuizInput>) {
    const { questions, ...quizData } = input;

    return this.prisma.profileQuiz.update({
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
  }

  async delete(id: string) {
    return this.prisma.profileQuiz.delete({
      where: { id },
      include: {
        questions: true,
        attempts: true
      },
    });
  }
} 