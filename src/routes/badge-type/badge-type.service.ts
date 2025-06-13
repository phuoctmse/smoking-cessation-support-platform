import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { CreateBadgeTypeType } from './schema/create-badge.schema'
import { BadgeTypeRepository } from './badge-type.repository'
import { UserType } from 'src/shared/models/share-user.model'
import { BadgeType } from './entities/badge-type.entity'
import { UpdateBadgeTypeType } from './schema/update-badge.schema'
import {PaginationParamsType} from "../../shared/models/pagination.model";
import { BadgeTypeFiltersInput } from './dto/request/badge-type-filter.input'
import { PaginatedBadgeTypesResponse } from './dto/response/paginated-badge-type.response'
import { RoleName } from 'src/shared/constants/role.constant'

@Injectable()
export class BadgeTypeService {
  private readonly logger = new Logger(BadgeTypeService.name);

  constructor(private readonly badgeTypeRepository: BadgeTypeRepository) {}

  async create(data: CreateBadgeTypeType, user: UserType): Promise<BadgeType> {
    this.validateManagePermission(user.role);
    await this.validateUniqueName(data.name);

    try {
      const badgeType = await this.badgeTypeRepository.create(data);
      this.logger.log(`BadgeType created: ${badgeType.id} by user: ${user.id}`);
      return this.transformToEntity(badgeType);
    } catch (error) {
      this.logger.error(`Failed to create badge type: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create badge type.');
    }
  }

  async findOne(id: string): Promise<BadgeType> {
    const badgeType = await this.badgeTypeRepository.findOne(id);
    if (!badgeType) {
      throw new NotFoundException('Badge type not found.');
    }
    return this.transformToEntity(badgeType);
  }

  async findAll(
    params: PaginationParamsType,
    filters: BadgeTypeFiltersInput,
    user: UserType,
  ): Promise<PaginatedBadgeTypesResponse> {
    const result = await this.badgeTypeRepository.findAll(params, filters);

    const transformedData = result.data.map(badgeType => this.transformToEntity(badgeType));

    return {
      ...result,
      data: transformedData,
    };
  }

  getStatistics(user: UserType) {
    this.validateViewStatisticsPermission(user.role);
    return this.badgeTypeRepository.getStatistics();
  }

  async update(id: string, data: UpdateBadgeTypeType, user: UserType): Promise<BadgeType> {
    this.validateManagePermission(user.role);
    await this.validateBadgeTypeExists(id);

    if (data.name) {
      await this.validateUniqueName(data.name, id);
    }

    try {
      const updatedBadgeType = await this.badgeTypeRepository.update(id, data);
      this.logger.log(`BadgeType updated: ${updatedBadgeType.id} by user: ${user.id}`);
      return this.transformToEntity(updatedBadgeType);
    } catch (error) {
      this.logger.error(`Failed to update badge type: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update badge type.');
    }
  }

  async remove(id: string, user: UserType): Promise<BadgeType> {
    this.validateManagePermission(user.role);
    await this.validateBadgeTypeExists(id);

    try {
      const deactivatedBadgeType = await this.badgeTypeRepository.delete(id);
      this.logger.log(`BadgeType deactivated: ${deactivatedBadgeType.id} by user: ${user.id}`);
      return this.transformToEntity(deactivatedBadgeType);
    } catch (error) {
      this.logger.error(`Failed to deactivate badge type: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to deactivate badge type.');
    }
  }

  private validateManagePermission(userRole: string): void {
    if (userRole !== RoleName.Admin) {
      throw new ForbiddenException('Only Admin can manage badge types.');
    }
  }

  private validateViewStatisticsPermission(userRole: string): void {
    if (userRole !== RoleName.Admin && userRole !== RoleName.Coach) {
      throw new ForbiddenException('Only Admin and Coach can view badge type statistics.');
    }
  }

  private async validateBadgeTypeExists(id: string): Promise<void> {
    const badgeType = await this.badgeTypeRepository.findOne(id);
    if (!badgeType) {
      throw new NotFoundException('Badge type not found.');
    }
  }

  private async validateUniqueName(name: string, excludeId?: string): Promise<void> {
    const existingBadgeType = await this.badgeTypeRepository.findByName(name);
    if (existingBadgeType && existingBadgeType.id !== excludeId) {
      throw new ConflictException('Badge type name already exists.');
    }
  }

  private transformToEntity(dbBadgeType: any): BadgeType {
    return {
      id: dbBadgeType.id,
      name: dbBadgeType.name,
      is_active: dbBadgeType.is_active,
      created_at: dbBadgeType.created_at,
      updated_at: dbBadgeType.updated_at,
    };
  }
}