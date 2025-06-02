import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PlanStageStatus } from '@prisma/client';
import { PlanStageRepository, PlanStageFilters } from './plan-stage.repository';
import { CessationPlanRepository } from '../cessation-plan/cessation-plan.repository';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { RoleName } from '../../shared/constants/role.constant';
import { CreatePlanStageType } from './schema/create-plan-stage.schema';
import { UpdatePlanStageType } from './schema/update-plan-stage.schema';
import { PlanStage } from './entities/plan-stage.entity'

@Injectable()
export class PlanStageService {
  private readonly logger = new Logger(PlanStageService.name);

  constructor(
    private readonly planStageRepository: PlanStageRepository,
    private readonly cessationPlanRepository: CessationPlanRepository,
  ) {}

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

    await this.validateAccessPermission(stage.plan_id, userId, userRole);

    return this.enrichWithComputedFields(stage);
  }

  async findByPlanId(planId: string, userRole: string, userId: string) {
    await this.validateAccessPermission(planId, userId, userRole);

    const stages = await this.planStageRepository.findByPlanId(planId);
    return stages.map(stage => this.enrichWithComputedFields(stage));
  }

  async findActiveByPlanId(planId: string, userRole: string, userId: string) {
    await this.validateAccessPermission(planId, userId, userRole);

    const stages = await this.planStageRepository.findActiveByPlanId(planId);
    return stages.map(stage => this.enrichWithComputedFields(stage));
  }

  async create(data: CreatePlanStageType, userRole: string, userId: string) {
    await this.validateAccessPermission(data.plan_id, userId, userRole);
    await this.validateCreateRules(data);

    try {
      const stage = await this.planStageRepository.create(data);
      this.logger.log(`Plan stage created: ${stage.id} for plan: ${stage.plan_id}`);
      return this.enrichWithComputedFields(stage);
    } catch (error) {
      this.handleDatabaseError(error);
    }
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

    await this.validateAccessPermission(existingStage.plan_id, userId, userRole);

    if (data.status && data.status !== existingStage.status) {
      this.validateStatusTransition(existingStage.status, data.status);
    }

    this.validateUpdateRules(data, existingStage);

    try {
      const updatedStage = await this.planStageRepository.update(id, data);
      this.logger.log(`Plan stage updated: ${updatedStage.id}`);
      return this.enrichWithComputedFields(updatedStage);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async createStagesFromTemplate(planId: string, userRole: string, userId: string) {
    await this.validateAccessPermission(planId, userId, userRole);

    const plan = await this.cessationPlanRepository.findOne(planId);
    if (!plan) {
      throw new NotFoundException('Cessation plan not found');
    }

    if (!plan.template_id) {
      throw new BadRequestException('Plan must have a template to generate stages');
    }

    const existingStages = await this.planStageRepository.findByPlanId(planId);
    if (existingStages.length > 0) {
      throw new ConflictException('Plan already has stages');
    }

    const result = await this.planStageRepository.createStagesFromTemplate(planId, plan.template_id);
    this.logger.log(`Created ${result.count} stages for plan: ${planId}`);

    const createdStages = await this.planStageRepository.findByPlanId(planId);
    return createdStages.map(stage => this.enrichWithComputedFields(stage));
  }

  async reorderStages(
    planId: string,
    stageOrders: { id: string; order: number }[],
    userRole: string,
    userId: string,
  ) {
    await this.validateAccessPermission(planId, userId, userRole);
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

  async getStageStatistics(filters?: PlanStageFilters, userRole?: string, userId?: string) {
    if (userRole === RoleName.Member) {
      throw new ForbiddenException('Only coaches and admins can access stage statistics');
    }

    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId);
    return this.planStageRepository.getStageStatistics(effectiveFilters);
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
    let daysSinceStart = 0;
    let daysToEnd = 0;
    let isOverdue = false;

    if (stage.start_date) {
      const startDate = new Date(stage.start_date);
      daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (stage.end_date) {
      const endDate = new Date(stage.end_date);
      daysToEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      isOverdue = now > endDate && !['COMPLETED', 'SKIPPED'].includes(stage.status);
    }

    return {
      ...stage,
      days_since_start: Math.max(0, daysSinceStart),
      days_to_end: Math.max(0, daysToEnd),
      is_overdue: isOverdue,
      can_start: this.canStartStage(stage),
      can_complete: this.canCompleteStage(stage),
    } as PlanStage;
  }

  private canStartStage(stage: any): boolean {
    return stage.status === 'PENDING';
  }

  private canCompleteStage(stage: any): boolean {
    return stage.status === 'ACTIVE';
  }

  private async validateAccessPermission(planId: string, userId: string, userRole: string): Promise<void> {
    const plan = await this.cessationPlanRepository.findOne(planId);
    if (!plan) {
      throw new NotFoundException('Cessation plan not found');
    }

    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only access stages of your own plans');
    }
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
    } else if (data.start_date && data.start_date >= existingStage.end_date) {
      throw new BadRequestException('Start date must be before end date');
    } else if (data.end_date && data.end_date <= existingStage.start_date) {
      throw new BadRequestException('End date must be after start date');
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
    if (error.code === 'P2002') {
      throw new ConflictException('A stage with similar data already exists');
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Referenced resource not found');
    }
    throw new BadRequestException('Failed to process plan stage operation');
  }
}