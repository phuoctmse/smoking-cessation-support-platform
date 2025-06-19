import { Feedback, Prisma } from '@prisma/client'
import { CreateFeedbackType } from './schema/create-feedback.schema'
import { UpdateFeedbackType } from './schema/update-feedback.schema'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { FeedbackFiltersInput } from './dto/request/feedback-filters.input'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/services/prisma.service'

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFeedbackType & { user_id: string }): Promise<Feedback> {
    return this.prisma.feedback.create({
      data: {
        user_id: data.user_id,
        template_id: data.template_id,
        rating: data.rating,
        content: data.content,
        is_anonymous: data.is_anonymous || false,
        is_deleted: false,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findOne(id: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({
      where: { id, is_deleted: false },
      include: this.getDefaultIncludes(),
    });
  }

  async findByUserAndTemplate(userId: string, templateId: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({
      where: {
        user_id_template_id: {
          user_id: userId,
          template_id: templateId,
        },
        is_deleted: false,
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findAnyByUserAndTemplate(userId: string, templateId: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({
      where: {
        user_id_template_id: {
          user_id: userId,
          template_id: templateId,
        },
      },
      include: this.getDefaultIncludes(),
    });
  }

  async findAll(params: PaginationParamsType, filters?: FeedbackFiltersInput) {
    const { page, limit, orderBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.FeedbackWhereInput = {
      is_deleted: false,
    };

    if (filters?.userId) {
      where.user_id = filters.userId;
    }
    if (filters?.templateId) {
      where.template_id = filters.templateId;
    }

    const ratingFilterConditions: Prisma.IntFilter = {};
    let hasRatingCondition = false;

    if (filters?.minRating !== undefined) {
      ratingFilterConditions.gte = filters.minRating;
      hasRatingCondition = true;
    }
    if (filters?.maxRating !== undefined) {
      ratingFilterConditions.lte = filters.maxRating;
      hasRatingCondition = true;
    }

    if (hasRatingCondition) {
      where.rating = ratingFilterConditions;
    }

    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: this.getDefaultIncludes(),
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    };
  }

  async getAllRatingsForTemplate(templateId: string): Promise<{ rating: number }[]> {
    return this.prisma.feedback.findMany({
      where: {
        template_id: templateId,
        is_deleted: false,
      },
      select: {
        rating: true,
      },
    });
  }

  async update(id: string, data: UpdateFeedbackType): Promise<Feedback | null> {
    return this.prisma.feedback.update({
      where: { id, is_deleted: false },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  async updateById(id: string, data: Partial<Prisma.FeedbackUpdateInput>): Promise<Feedback | null> {
    return this.prisma.feedback.update({
      where: { id },
      data,
      include: this.getDefaultIncludes(),
    });
  }

  async remove(id: string): Promise<Feedback | null> {
    return this.prisma.feedback.update({
      where: { id, is_deleted: false },
      data: { is_deleted: true, updated_at: new Date() },
      include: this.getDefaultIncludes(),
    });
  }

  private getDefaultIncludes(): Prisma.FeedbackInclude {
    return {
      user: {
        select: { id: true, name: true, avatar_url: true, role: true },
      },
      template: {
        include: {
          coach: {
            select: { id: true, name: true, avatar_url: true, role: true },
          },
        },
      },
    };
  }
}