import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { FeedbackRepository } from './feedback.repository'
import { CessationPlanTemplateRepository } from '../cessation-plan-template/cessation-plan-template.repository'
import { Prisma } from '@prisma/client'
import { UserType } from 'src/shared/models/share-user.model'
import { CreateFeedbackType } from './schema/create-feedback.schema'
import { RoleName } from '../../shared/constants/role.constant'
import { PaginationParamsType } from '../../shared/models/pagination.model'
import { FeedbackFiltersInput } from './dto/request/feedback-filters.input'
import { UpdateFeedbackType } from './schema/update-feedback.schema'
import { Feedback } from './entities/feedback.entity'
import {CessationPlanRepository} from "../cessation-plan/cessation-plan.repository";
import {PlanStageRepository} from "../plan-stage/plan-stage.repository";

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly cessationPlanTemplateRepository: CessationPlanTemplateRepository,
    private readonly cessationPlanRepository: CessationPlanRepository,
    private readonly planStageRepository: PlanStageRepository,
  ) {}

  async create(data: CreateFeedbackType, user: UserType): Promise<Feedback> {
    await this.validateTemplate(data.template_id);
    await this.checkExistingFeedback(user.id, data.template_id);

    if (user.role === RoleName.Member) {
      await this.validateMemberHasUsedTemplate(user.id, data.template_id);
    }

    try {
      const feedbackData = { ...data, user_id: user.id };
      const feedback = await this.feedbackRepository.create(feedbackData);
      await this.recalculateTemplateRating(data.template_id);

      this.logger.log(`Feedback created: ${feedback.id}`);
      return this.transformToEntity(feedback);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already submitted feedback for this template. Please update your existing feedback.');
      }
      this.logger.error(`Failed to create feedback: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create feedback.');
    }
  }

  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found.');
    }

    return this.transformToEntity(feedback);
  }

  async findAll(params: PaginationParamsType, filters: FeedbackFiltersInput | undefined, user: UserType) {
    const effectiveFilters = await this.buildEffectiveFilters(filters, user);
    const result = await this.feedbackRepository.findAll(params, effectiveFilters);

    const transformedData = result.data.map(feedback => this.transformToEntity(feedback));

    return {
      ...result,
      data: transformedData,
    };
  }

  async update(id: string, data: UpdateFeedbackType, user: UserType): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found.');
    }

    this.validateOwnership(feedback, user.id);
    this.validateAnonymousUpdate(feedback);

    try {
      const updatedFeedback = await this.feedbackRepository.update(id, data);
      if (!updatedFeedback) {
        throw new NotFoundException('Feedback not found or already deleted.');
      }

      if (data.rating && data.rating !== feedback.rating) {
        await this.recalculateTemplateRating(updatedFeedback.template_id);
      }

      this.logger.log(`Feedback updated: ${updatedFeedback.id}`);
      return this.transformToEntity(updatedFeedback);
    } catch (error) {
      this.logger.error(`Failed to update feedback: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update feedback.');
    }
  }

  async remove(id: string, user: UserType): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found.');
    }

    this.validateDeletePermission(feedback, user);

    try {
      const removedFeedback = await this.feedbackRepository.remove(id);
      if (!removedFeedback) {
        throw new NotFoundException('Feedback not found or already deleted.');
      }

      await this.recalculateTemplateRating(removedFeedback.template_id);
      this.logger.log(`Feedback removed: ${removedFeedback.id}`);
      return this.transformToEntity(removedFeedback);
    } catch (error) {
      this.logger.error(`Failed to remove feedback: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove feedback.');
    }
  }

  private async validateTemplate(templateId: string): Promise<void> {
    const template = await this.cessationPlanTemplateRepository.findOne(templateId);
    if (!template) {
      throw new NotFoundException('Cessation plan template not found.');
    }
  }

  private async checkExistingFeedback(userId: string, templateId: string): Promise<void> {
    const existingFeedback = await this.feedbackRepository.findByUserAndTemplate(userId, templateId);
    if (existingFeedback) {
      throw new ConflictException('You have already submitted feedback for this template. Please update your existing feedback.');
    }
  }

  private async validateMemberHasUsedTemplate(userId: string, templateId: string): Promise<void> {
    const userPlansWithTemplate = await this.cessationPlanRepository.findByUserAndTemplate(userId, templateId);

    if (!userPlansWithTemplate || userPlansWithTemplate.length === 0) {
      throw new ForbiddenException('You can only provide feedback for templates you have used in your cessation plans.');
    }

    const hasCompletedOrActiveUsage = userPlansWithTemplate.some(plan =>
        plan.status === 'COMPLETED' ||
        plan.status === 'ACTIVE' ||
        plan.status === 'PAUSED'
    );

    if (!hasCompletedOrActiveUsage) {
      throw new ForbiddenException('You can only provide feedback for templates from plans that you have actively used (not just planned).');
    }

    const validPlanIds = userPlansWithTemplate
        .filter(plan =>
            plan.status === 'COMPLETED' ||
            plan.status === 'ACTIVE' ||
            plan.status === 'PAUSED'
        )
        .map(plan => plan.id);

    let hasCompletedStages = false;

    for (const planId of validPlanIds) {
      const completedStages = await this.planStageRepository.findAll(
          { page: 1, limit: 1, orderBy: 'created_at', sortOrder: 'desc' },
          {
            plan_id: planId,
            status: 'COMPLETED'
          }
      );

      if (completedStages.total > 0) {
        hasCompletedStages = true;
        break;
      }
    }

    if (!hasCompletedStages) {
      throw new ForbiddenException('You can only provide feedback for templates from plans where you have completed at least one stage.');
    }
  }

  private validateOwnership(feedback: any, userId: string): void {
    if (feedback.user_id !== userId) {
      throw new ForbiddenException('You can only update your own feedback.');
    }
  }

  private validateAnonymousUpdate(feedback: any): void {
    if (feedback.is_anonymous) {
      throw new ForbiddenException('Anonymous feedback cannot be updated.');
    }
  }

  private validateDeletePermission(feedback: any, user: UserType): void {
    const isOwner = feedback.user_id === user.id;
    const isAdmin = user.role === RoleName.Admin;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own feedback or you are not an Admin.');
    }
  }

  private async buildEffectiveFilters(filters: FeedbackFiltersInput | undefined, user: UserType) {
    let effectiveFilters = { ...filters };

    if (user.role === RoleName.Coach) {
      effectiveFilters = await this.applyCoachFilters(effectiveFilters, user.id);
    }

    return effectiveFilters;
  }

  private async applyCoachFilters(filters: any, coachId: string) {
    if (filters.templateId) {
      await this.validateCoachTemplateAccess(filters.templateId, coachId);
    } else if (!filters.userId) {
      const coachTemplateIds = await this.getCoachTemplateIds(coachId);
      if (coachTemplateIds.length === 0) {
        return { templateId: 'non-existent-id' };
      }
      filters.templateId = { in: coachTemplateIds };
    }

    return filters;
  }

  private async validateCoachTemplateAccess(templateId: string, coachId: string): Promise<void> {
    const template = await this.cessationPlanTemplateRepository.findOne(templateId);
    if (!template || template.coach_id !== coachId) {
      throw new ForbiddenException('You can only view feedback for your own templates.');
    }
  }

  private async getCoachTemplateIds(coachId: string): Promise<string[]> {
    const coachTemplates = await this.cessationPlanTemplateRepository.findAll(
      { page: 1, limit: 10000, orderBy: 'name', sortOrder: 'asc' },
      { coachId }
    );
    return coachTemplates.data.map(template => template.id);
  }

  private async recalculateTemplateRating(templateId: string): Promise<void> {
    const ratingsData = await this.feedbackRepository.getAllRatingsForTemplate(templateId);
    const totalReviews = ratingsData.length;
    let averageRating = 0;

    if (totalReviews > 0) {
      const sumOfRatings = ratingsData.reduce((sum, item) => sum + item.rating, 0);
      averageRating = sumOfRatings / totalReviews;
    }

    await this.cessationPlanTemplateRepository.setAverageRating(templateId, averageRating, totalReviews);
    this.logger.log(`Recalculated average rating for template ${templateId}: ${averageRating.toFixed(2)} from ${totalReviews} reviews.`);
  }

  private transformToEntity(dbFeedback: any): Feedback {
    if (!dbFeedback) {
      return null;
    }

    const {
      user: dbUser,
      user_id: dbUserIdScalar,
      template: dbTemplate,
      id,
      template_id: dbTemplateIdScalar,
      rating,
      content,
      is_anonymous,
      is_deleted,
      created_at,
      updated_at,
    } = dbFeedback;

    const feedback: Feedback = {
      id,
      template_id: dbTemplateIdScalar,
      rating,
      content,
      is_anonymous,
      is_deleted,
      created_at,
      updated_at,
      template: dbTemplate,
      user: null,
      user_id: null,
    };

    if (!is_anonymous && dbUser) {
      feedback.user = dbUser;
      feedback.user_id = dbUserIdScalar;
    }

    return feedback;
  }
}