import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PlanStageStatus, Prisma } from '@prisma/client'
import { PlanStageRepository, PlanStageFilters } from './plan-stage.repository';
import { CessationPlanRepository } from '../cessation-plan/cessation-plan.repository';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { RoleName } from '../../shared/constants/role.constant';
import { CreatePlanStageType } from './schema/create-plan-stage.schema';
import { UpdatePlanStageType } from './schema/update-plan-stage.schema';
import { PlanStage } from './entities/plan-stage.entity'
import { CessationPlan } from '../cessation-plan/entities/cessation-plan.entity'
import { BadgeAwardService } from '../badge-award/badge-award.service';

@Injectable()
export class PlanStageService {
  private readonly logger = new Logger(PlanStageService.name);

  constructor(
    private readonly planStageRepository: PlanStageRepository,
    private readonly cessationPlanRepository: CessationPlanRepository,
    private readonly badgeAwardService: BadgeAwardService,
  ) {}

  async create(data: CreatePlanStageType, userRole: string, userId: string) {
    const plan = await this.validateAccessAndGetPlan(data.plan_id, userId, userRole);
    this.validatePlanIsCustomizable(plan);
    await this.validateCreateRules(data);

    try {
      const stage = await this.planStageRepository.create(data);
      this.logger.log(`Plan stage created: ${stage.id} for plan: ${stage.plan_id}`);
      return this.enrichWithComputedFields(stage);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async createStagesFromTemplate(planId: string, userRole: string, userId: string) {
    const plan = await this.validateAccessAndGetPlan(planId, userId, userRole);
    if (!plan.template_id) {
      throw new BadRequestException('Plan must have a template to generate stages');
    }
    const existingStages = await this.planStageRepository.findByPlanId(planId);
    if (existingStages.length > 0) {
      throw new ConflictException('Plan already has stages. If you want to customize, please do so manually or ensure the plan is empty before generating from template.');
    }

    const result = await this.planStageRepository.createStagesFromTemplate(planId, plan.template_id);
    this.logger.log(`Created ${result.count} stages for plan: ${planId}`);

    const createdStages = await this.planStageRepository.findByPlanId(planId);
    return createdStages.map(stage => this.enrichWithComputedFields(stage));
  }

  async findAll(
    params: PaginationParamsType,
    filters?: PlanStageFilters,
    userRole?: string,
    userId?: string,
  ) {
    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId);
    const result = await this.planStageRepository.findAll(params, effectiveFilters);

    return {
      ...result,
      data: result.data.map(stage => this.enrichWithComputedFields(stage)),
    };
  }

  async findOne(id: string, userRole: string, userId: string) {
    const stage = await this.planStageRepository.findOne(id);

    if (!stage) {
      throw new NotFoundException('Plan stage not found');
    }

    await this.validateAccessAndGetPlan(stage.plan_id, userId, userRole);

    return this.enrichWithComputedFields(stage);
  }

  async findByPlanId(planId: string, userRole: string, userId: string) {
    await this.validateAccessAndGetPlan(planId, userId, userRole);

    const stages = await this.planStageRepository.findByPlanId(planId);
    return stages.map(stage => this.enrichWithComputedFields(stage));
  }

  async findActiveByPlanId(planId: string, userRole: string, userId: string) {
    await this.validateAccessAndGetPlan(planId, userId, userRole);

    const stages = await this.planStageRepository.findActiveByPlanId(planId);
    return stages.map(stage => this.enrichWithComputedFields(stage));
  }

  async getStageStatistics(filters?: PlanStageFilters, userRole?: string, userId?: string) {
    if (userRole === RoleName.Member) {
      throw new ForbiddenException('Only coaches and admins can access stage statistics');
    }

    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId);
    return this.planStageRepository.getStageStatistics(effectiveFilters);
  }

  async update(
    id: string,
    data: Omit<UpdatePlanStageType, 'id'>,
    userRole: string,
    userId: string,
  ) {
    const existingStage = await this.planStageRepository.findOne(id);

    if (!existingStage) {
      throw new NotFoundException('Plan stage not found');
    }

    const plan = await this.validateAccessAndGetPlan(existingStage.plan_id, userId, userRole);
    this.validatePlanIsCustomizable(plan);

    if (data.status && data.status !== existingStage.status) {
      this.validateStatusTransition(existingStage.status, data.status);
    }

    this.validateUpdateRules(data, existingStage);

    try {
      const updatedStage = await this.planStageRepository.update(id, data);
      this.logger.log(`Plan stage updated: ${updatedStage.id}`);

      if (updatedStage.status === PlanStageStatus.COMPLETED) {
        const planStages = await this.planStageRepository.findByPlanId(updatedStage.plan_id);
        const completedStagesInPlan = planStages.filter(s => s.status === PlanStageStatus.COMPLETED).length;
        await this.badgeAwardService.processStageCompletion(userId, updatedStage.plan_id, completedStagesInPlan);
      }

      return this.enrichWithComputedFields(updatedStage);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async reorderStages(
    planId: string,
    stageOrders: { id: string; order: number }[],
    userRole: string,
    userId: string,
  ) {
    const plan = await this.validateAccessAndGetPlan(planId, userId, userRole);
    this.validatePlanIsCustomizable(plan);
    await this.validateStagesBelongToPlan(planId, stageOrders.map(s => s.id));
    this.validateOrderSequence(stageOrders);

    try {
      const reorderedStages = await this.planStageRepository.reorderStages(planId, stageOrders);
      this.logger.log(`Reordered ${stageOrders.length} stages for plan: ${planId}`);
      return reorderedStages.map(stage => this.enrichWithComputedFields(stage));
    } catch (error) {
      this.logger.error(`Failed to reorder stages: ${error.message}`);
      throw new BadRequestException('Failed to reorder stages');
    }
  }

  async remove(id: string, userRole: string, userId: string): Promise<PlanStage> {
    const existingStage = await this.planStageRepository.findOne(id);
    if (!existingStage) {
      throw new NotFoundException('Plan stage not found');
    }

    const plan = await this.validateAccessAndGetPlan(existingStage.plan_id, userId, userRole);
    this.validatePlanIsCustomizable(plan);

    try {
      const removedStage = await this.planStageRepository.remove(id);
      this.logger.log(`Plan stage removed (soft delete): ${removedStage.id}`);
      return this.enrichWithComputedFields(removedStage);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private applyRoleBasedFilters(
    filters?: PlanStageFilters,
    userRole?: string,
    userId?: string,
  ): PlanStageFilters {
    const effectiveFilters = { ...filters };

    if (userRole === RoleName.Member && userId) {
      effectiveFilters.user_id = userId;
    }

    return effectiveFilters;
  }

  private enrichWithComputedFields(stage: any): PlanStage {
    const now = new Date();
    const startDate = stage.start_date ? new Date(stage.start_date) : null;
    const endDate = stage.end_date ? new Date(stage.end_date) : null;

    let daysSinceStart = 0;
    let daysToEnd = 0;
    let isOverdue = false;

    if (startDate) {
      daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    if (endDate) {
      daysToEnd = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (now > endDate && stage.status !== PlanStageStatus.COMPLETED) {
        isOverdue = true;
      }
    }

    return {
      ...stage,
      days_since_start: daysSinceStart,
      days_to_end: daysToEnd,
      is_overdue: isOverdue,
      can_start: this.canStartStage(stage),
      can_complete: this.canCompleteStage(stage),
    } as PlanStage;
  }

  private canStartStage(stage: any): boolean {
    return stage.status === PlanStageStatus.PENDING;
  }

  private canCompleteStage(stage: any): boolean {
    return stage.status === PlanStageStatus.ACTIVE;
  }

  private async validateAccessAndGetPlan(planId: string, userId: string, userRole: string): Promise<CessationPlan> {
    const plan = await this.cessationPlanRepository.findOne(planId);
    if (!plan) {
      throw new NotFoundException('Cessation plan not found')
    }

    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only access stages of your own plans');
    }
    return plan as unknown as CessationPlan;
  }

  private validateStatusTransition(currentStatus: PlanStageStatus, newStatus: PlanStageStatus): void {
    const validTransitions: Record<PlanStageStatus, PlanStageStatus[]> = {
      PENDING: ['ACTIVE', 'SKIPPED'],
      ACTIVE: ['COMPLETED', 'SKIPPED', 'PENDING'],
      COMPLETED: [],
      SKIPPED: ['PENDING'],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async validateCreateRules(data: CreatePlanStageType): Promise<void> {
    const existingStage = await this.planStageRepository.findByStageOrder(data.plan_id, data.stage_order);
    if (existingStage) {
      throw new ConflictException('Stage order already exists for this plan');
    }

    if (data.start_date && data.end_date && data.end_date <= data.start_date) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private validateUpdateRules(data: Omit<UpdatePlanStageType, 'id'>, existingStage: any): void {
    if (data.start_date && data.end_date) {
      if (data.end_date <= data.start_date) {
        throw new BadRequestException('End date must be after start date');
      }
    } else if (data.start_date && existingStage.end_date && data.start_date >= existingStage.end_date) {
      throw new BadRequestException('Start date must be before existing end date');
    } else if (data.end_date && existingStage.start_date && data.end_date <= existingStage.start_date) {
      throw new BadRequestException('End date must be after existing start date');
    }
  }

  private validatePlanIsCustomizable(plan: CessationPlan): void {
    if (plan.is_custom === false) {
      throw new ForbiddenException(
        'This plan is not customizable. Stages cannot be manually created, updated, or reordered.',
      );
    }
  }

  private async validateStagesBelongToPlan(planId: string, stageIds: string[]): Promise<void> {
    const planStages = await this.planStageRepository.findByPlanId(planId);
    const planStageIds = planStages.map(stage => stage.id);
    const invalidIds = stageIds.filter(id => !planStageIds.includes(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException('Some stages do not belong to the specified plan');
    }
  }

  private validateOrderSequence(stageOrders: { id: string; order: number }[]): void {
    const orders = stageOrders.map(s => s.order);
    const uniqueOrders = new Set(orders);

    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Stage orders must be unique');
    }

    const sortedOrders = [...orders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        throw new BadRequestException('Stage orders must be sequential starting from 1');
      }
    }
  }

  private handleDatabaseError(error: any): never {
    this.logger.error(`Database Error: ${error.message}`, error.stack);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A stage with similar unique data (e.g., plan_id and stage_order) already exists.');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('The resource to update or delete was not found. It might have been already removed.');
      }
    }
    throw new BadRequestException('Failed to process plan stage operation due to a database issue.');
  }
}