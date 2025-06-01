import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CessationPlanStatus } from '@prisma/client';
import { CessationPlanRepository, CessationPlanFilters } from './cessation-plan.repository';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { RoleName } from '../../shared/constants/role.constant';
import { CreateCessationPlanType } from './schema/create-cessation-plan.schema'
import { UpdateCessationPlanType } from './schema/update-cessation-plan.schema'

@Injectable()
export class CessationPlanService {
  private readonly logger = new Logger(CessationPlanService.name);

  constructor(
      private readonly cessationPlanRepository: CessationPlanRepository,
  ) {}

  async findAll(
      params: PaginationParamsType,
      filters?: CessationPlanFilters,
      userRole?: string,
      userId?: string,
  ) {
    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId);
    const result = await this.cessationPlanRepository.findAll(params, effectiveFilters);

    return {
      ...result,
      data: result.data.map(plan => this.enrichWithComputedFields(plan)),
    };
  }

  async findOne(id: string, userRole: string, userId: string) {
    const plan = await this.cessationPlanRepository.findOne(id);

    if (!plan) {
      throw new NotFoundException('Cessation plan not found');
    }

    this.validateAccessPermission(plan, userId, userRole);

    return this.enrichWithComputedFields(plan);
  }

  async findByUserId(targetUserId: string, requestUserId: string, userRole: string) {
    this.validateUserAccessPermission(targetUserId, requestUserId, userRole);

    const plans = await this.cessationPlanRepository.findByUserId(targetUserId);
    return plans.map(plan => this.enrichWithComputedFields(plan));
  }

  async findActiveByUserId(targetUserId: string, requestUserId: string, userRole: string) {
    this.validateUserAccessPermission(targetUserId, requestUserId, userRole);

    const plans = await this.cessationPlanRepository.findActiveByUserId(targetUserId);
    return plans.map(plan => this.enrichWithComputedFields(plan));
  }

  async create(data: CreateCessationPlanType, userRole: string, requestUserId: string) {
    await this.validateCreateRules(data, requestUserId);

    try {
      const plan = await this.cessationPlanRepository.create({
        ...data,
        user_id: requestUserId,
      });

      this.logger.log(`Cessation plan created: ${plan.id} for user: ${plan.user_id}`);
      return this.enrichWithComputedFields(plan);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async update(
      id: string,
      data: Omit<UpdateCessationPlanType, 'id'>,
      userRole: string,
      userId: string,
  ) {
    const existingPlan = await this.cessationPlanRepository.findOne(id);

    if (!existingPlan) {
      throw new NotFoundException('Cessation plan not found');
    }

    this.validateUpdatePermission(existingPlan, userId, userRole);

    if (data.status && data.status !== existingPlan.status) {
      this.validateStatusTransition(existingPlan.status, data.status);
    }

    this.validateUpdateRules(data, existingPlan);

    try {
      const updatedPlan = await this.cessationPlanRepository.update(id, data);
      this.logger.log(`Cessation plan updated: ${updatedPlan.id}`);
      return this.enrichWithComputedFields(updatedPlan);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async getStatistics(filters?: CessationPlanFilters, userRole?: string, userId?: string) {
    if (userRole === RoleName.Member) {
      throw new ForbiddenException('Only coaches and admins can access statistics');
    }

    const effectiveFilters = this.applyRoleBasedFilters(filters, userRole, userId);
    return this.cessationPlanRepository.getStatistics(effectiveFilters);
  }

  private applyRoleBasedFilters(
      filters?: CessationPlanFilters,
      userRole?: string,
      userId?: string,
  ): CessationPlanFilters {
    const effectiveFilters = { ...filters };

    if (userRole === RoleName.Member && userId) {
      effectiveFilters.user_id = userId;
    }

    return effectiveFilters;
  }

  private enrichWithComputedFields(plan: any) {
    const now = new Date();
    const startDate = new Date(plan.start_date);
    const targetDate = new Date(plan.target_date);

    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const completionPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...plan,
      completion_percentage: parseFloat(completionPercentage.toFixed(2)),
      days_since_start: Math.max(0, daysSinceStart),
      days_to_target: Math.max(0, daysToTarget),
      is_overdue: now > targetDate && !['COMPLETED', 'CANCELLED'].includes(plan.status),
    };
  }

  private validateAccessPermission(plan: any, userId: string, userRole: string): void {
    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only access your own cessation plans');
    }
  }

  private validateUserAccessPermission(targetUserId: string, requestUserId: string, userRole: string): void {
    if (userRole === RoleName.Member && targetUserId !== requestUserId) {
      throw new ForbiddenException('You can only access your own cessation plans');
    }
  }

  private validateUpdatePermission(plan: any, userId: string, userRole: string): void {
    if (userRole === RoleName.Member && plan.user_id !== userId) {
      throw new ForbiddenException('You can only update your own cessation plans');
    }
  }

  private validateStatusTransition(currentStatus: CessationPlanStatus, newStatus: CessationPlanStatus): void {
    const validTransitions: Record<CessationPlanStatus, CessationPlanStatus[]> = {
      PLANNING: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
      COMPLETED: [],
      ABANDONED: ['CANCELLED'],
      CANCELLED: ['PLANNING'],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async validateCreateRules(data: CreateCessationPlanType, userId: string): Promise<void> {
    const existingActivePlans = await this.cessationPlanRepository.findActiveByUserId(userId);
    if (existingActivePlans.length > 0) {
      throw new ConflictException('User already has an active cessation plan');
    }

    if (data.target_date <= data.start_date) {
      throw new BadRequestException('Target date must be after start date');
    }

    const now = new Date();
    if (data.start_date < now && Math.abs(data.start_date.getTime() - now.getTime()) > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Start date cannot be more than 1 day in the past');
    }
  }

  private validateUpdateRules(data: Omit<UpdateCessationPlanType, 'id'>, existingPlan: any): void {
    if (data.start_date && data.target_date) {
      if (data.target_date <= data.start_date) {
        throw new BadRequestException('Target date must be after start date');
      }
    } else if (data.start_date && data.start_date >= existingPlan.target_date) {
      throw new BadRequestException('Start date must be before target date');
    } else if (data.target_date && data.target_date <= existingPlan.start_date) {
      throw new BadRequestException('Target date must be after start date');
    }
  }

  private handleDatabaseError(error: any): never {
    if (error.code === 'P2002') {
      throw new ConflictException('A plan with similar data already exists');
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Referenced resource not found');
    }
    throw new BadRequestException('Failed to process cessation plan operation');
  }
}