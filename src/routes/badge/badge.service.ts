import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BadgeRepository } from './badge.repository'
import { CreateBadgeType } from './schema/create-badge.schema'
import { UserType } from '../user/schema/user.schema'
import { Badge } from './entities/badge.entity'
import { UpdateBadgeType } from './schema/update-badge.schema'
import { BadgeFiltersInput } from './dto/request/badge-filter.input'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { PaginatedBadgesResponse } from './dto/response/paginated-badge.response'
import { RoleName } from 'src/shared/constants/role.constant'
import { BadgeTypeRepository } from '../badge-type/badge-type.repository'

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    private readonly badgeRepository: BadgeRepository,
    private readonly badgeTypeRepository: BadgeTypeRepository,
  ) {}

  async create(data: CreateBadgeType, user: UserType): Promise<Badge> {
    this.validateManagePermission(user.role);
    await this.validateUniqueName(data.name);
    await this.validateBadgeTypeExists(data.badge_type_id);
    this.validateRequirements(data.requirements);

    try {
      const badge = await this.badgeRepository.create(data);
      this.logger.log(`Badge created: ${badge.id} by user: ${user.id}`);
      return this.transformToEntity(badge);
    } catch (error) {
      this.logger.error(`Failed to create badge: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create badge.');
    }
  }

  async findOne(id: string): Promise<Badge> {
    const badge = await this.badgeRepository.findOne(id);
    if (!badge) {
      throw new NotFoundException('Badge not found.');
    }
    return this.transformToEntity(badge);
  }

  async findAll(
      params: PaginationParamsType,
      filters: BadgeFiltersInput | undefined,
      user: UserType,
  ): Promise<PaginatedBadgesResponse> {
    const result = await this.badgeRepository.findAll(params, filters);

    const transformedData = result.data.map(badge => this.transformToEntity(badge));

    return {
      ...result,
      data: transformedData,
    };
  }

  async getStatistics(user: UserType) {
    this.validateViewStatisticsPermission(user.role);
    return this.badgeRepository.getStatistics();
  }

  async update(id: string, data: UpdateBadgeType, user: UserType): Promise<Badge> {
    this.validateManagePermission(user.role);
    await this.validateBadgeExists(id);

    if (data.name) {
      await this.validateUniqueName(data.name, id);
    }

    if (data.badge_type_id) {
      await this.validateBadgeTypeExists(data.badge_type_id);
    }

    if (data.requirements) {
      this.validateRequirements(data.requirements);
    }

    try {
      const updatedBadge = await this.badgeRepository.update(id, data);
      this.logger.log(`Badge updated: ${updatedBadge.id} by user: ${user.id}`);
      return this.transformToEntity(updatedBadge);
    } catch (error) {
      this.logger.error(`Failed to update badge: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update badge.');
    }
  }

  async remove(id: string, user: UserType): Promise<Badge> {
    this.validateManagePermission(user.role);
    await this.validateBadgeExists(id);

    try {
      const deactivatedBadge = await this.badgeRepository.delete(id);
      this.logger.log(`Badge deactivated: ${deactivatedBadge.id} by user: ${user.id}`);
      return this.transformToEntity(deactivatedBadge);
    } catch (error) {
      this.logger.error(`Failed to deactivate badge: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to deactivate badge.');
    }
  }

  private validateManagePermission(userRole: string): void {
    if (userRole !== RoleName.Admin && userRole !== RoleName.Coach) {
      throw new ForbiddenException('Only Admin and Coach can manage badges.');
    }
  }

  private validateViewStatisticsPermission(userRole: string): void {
    if (userRole !== RoleName.Admin && userRole !== RoleName.Coach) {
      throw new ForbiddenException('Only Admin and Coach can view badge statistics.');
    }
  }

  private async validateBadgeExists(id: string): Promise<void> {
    const badge = await this.badgeRepository.findOne(id);
    if (!badge) {
      throw new NotFoundException('Badge not found.');
    }
  }

  private async validateBadgeTypeExists(badgeTypeId: string): Promise<void> {
    const badgeType = await this.badgeTypeRepository.findOne(badgeTypeId);
    if (!badgeType) {
      throw new NotFoundException('Badge type not found.');
    }
  }

  private async validateUniqueName(name: string, excludeId?: string): Promise<void> {
    const existingBadge = await this.badgeRepository.findByName(name);
    if (existingBadge && existingBadge.id !== excludeId) {
      throw new ConflictException('Badge name already exists.');
    }
  }

  private validateRequirements(requirements?: string): void {
    if (!requirements) return;

    let parsedRequirements: any;
    try {
      parsedRequirements = JSON.parse(requirements);
    } catch (error) {
      throw new BadRequestException('Requirements must be a valid JSON string.');
    }

    if (typeof parsedRequirements !== 'object' || parsedRequirements === null) {
      throw new BadRequestException('Requirements JSON must be an object.');
    }

    if (
      !parsedRequirements.criteria_type ||
      typeof parsedRequirements.criteria_type !== 'string' ||
      parsedRequirements.criteria_type.trim() === ''
    ) {
      throw new BadRequestException(
        "Requirements JSON must include a non-empty 'criteria_type' string field.",
      );
    }

    if (parsedRequirements.criteria_type === 'streak_achieved') {
      if (typeof parsedRequirements.days !== 'number' || parsedRequirements.days <= 0) {
        throw new BadRequestException("For 'streak_achieved' criteria, 'days' must be a positive number.");
      }
    }
  }

  private transformToEntity(dbBadge: any): Badge {
    return {
      id: dbBadge.id,
      name: dbBadge.name,
      description: dbBadge.description,
      icon_url: dbBadge.icon_url,
      badge_type: dbBadge.badge_type,
      requirements: dbBadge.requirements,
      is_active: dbBadge.is_active,
      sort_order: dbBadge.sort_order,
      created_at: dbBadge.created_at,
      updated_at: dbBadge.updated_at,
    };
  }
}