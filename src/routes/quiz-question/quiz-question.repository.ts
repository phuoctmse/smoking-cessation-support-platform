import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateQuizQuestionInput } from './dto/request/create-quiz-question.input';
import { UpdateQuizQuestionInput } from './dto/request/update-quiz-question.input';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuizQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateQuizQuestionInput) {
    return this.prisma.quizQuestion.create({
      data: {
        quiz_id: input.quiz_id,
        question_text: input.question_text,
        description: input.description,
        question_type: input.question_type,
        options: input.options as Prisma.JsonValue,
        order: input.order,
        is_required: input.is_required,
        validation_rule: input.validation_rule as Prisma.JsonValue,
      },
    });
  }

  async findAll(quizId: string) {
    return this.prisma.quizQuestion.findMany({
      where: {
        quiz_id: quizId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.quizQuestion.findUnique({
      where: { id },
    });
  }

  async update(id: string, input: UpdateQuizQuestionInput) {
    const updateData: Prisma.QuizQuestionUpdateInput = {
      question_text: input.question_text,
      description: input.description,
      question_type: input.question_type,
      options: input.options as Prisma.JsonValue,
      order: input.order,
      is_required: input.is_required,
      validation_rule: input.validation_rule as Prisma.JsonValue,
    };

    return this.prisma.quizQuestion.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.quizQuestion.delete({
      where: { id },
    });
  }
} 