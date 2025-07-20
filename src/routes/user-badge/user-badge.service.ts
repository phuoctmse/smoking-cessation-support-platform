import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { UserBadgeRepository } from './user-badge.repository'
import { BadgeRepository } from '../badge/badge.repository'
import { PaginationParamsType } from 'src/shared/models/pagination.model'
import { PaginatedUserBadgesResponse } from './dto/response/paginated-user-badge.response'
import { UserBadgeFiltersInput } from './dto/request/user-badge-filter.input'
import { UserType } from '../user/schema/user.schema'
import { RoleName } from 'src/shared/constants/role.constant'
import {UserBadge} from "./entities/user-badge.entity";

@Injectable()
export class UserBadgeService {
  private readonly logger = new Logger(UserBadgeService.name);

  constructor(
    private readonly userBadgeRepository: UserBadgeRepository,
    private readonly badgeRepository: BadgeRepository,
  ) {}

  async getMyBadges(
    params: PaginationParamsType,
    filters: UserBadgeFiltersInput | undefined,
    user: UserType,
  ): Promise<PaginatedUserBadgesResponse> {
    const result = await this.userBadgeRepository.findUserBadges(user.id, params, filters);

    const transformedData = result.data.map(userBadge => this.transformToEntity(userBadge));

    return {
      ...result,
      data: transformedData,
    };
  }

  async getUserBadges(
    userId: string,
    params: PaginationParamsType,
    filters: UserBadgeFiltersInput | undefined,
    requestingUser: UserType,
  ): Promise<PaginatedUserBadgesResponse> {
    // Only admin and coach can view other users' badges
    if (requestingUser.role === RoleName.Member && requestingUser.id !== userId) {
      throw new ForbiddenException('You can only view your own badges.');
    }

    const result = await this.userBadgeRepository.findUserBadges(userId, params, filters);

    const transformedData = result.data.map(userBadge => this.transformToEntity(userBadge));

    return {
      ...result,
      data: transformedData,
    };
  }

  async getAllUserBadges(
    params: PaginationParamsType,
    filters: UserBadgeFiltersInput | undefined,
    user: UserType,
  ): Promise<PaginatedUserBadgesResponse> {
    this.validateViewAllPermission(user.role);

    const result = await this.userBadgeRepository.findAll(params, filters);

    const transformedData = result.data.map(userBadge => this.transformToEntity(userBadge));

    return {
      ...result,
      data: transformedData,
    };
  }

  async findOne(id: string, user: UserType): Promise<UserBadge> {
    const userBadge = await this.userBadgeRepository.findOne(id);
    if (!userBadge) {
      throw new NotFoundException('User badge not found.');
    }

    // Check permission
    if (user.role === RoleName.Member && userBadge.user_id !== user.id) {
      throw new ForbiddenException('You can only view your own badges.');
    }

    return this.transformToEntity(userBadge);
  }

  async getMyBadgeStats(user: UserType) {
    return this.userBadgeRepository.getUserBadgeStats(user.id);
  }

  async getUserBadgeStats(userId: string, requestingUser: UserType) {
    // Only admin and coach can view other users' badge stats
    if (requestingUser.role === RoleName.Member && requestingUser.id !== userId) {
      throw new ForbiddenException('You can only view your own badge statistics.');
    }

    return this.userBadgeRepository.getUserBadgeStats(userId);
  }

  async awardBadge(userId: string, badgeId: string, user: UserType): Promise<UserBadge> {
    this.validateAwardPermission(user.role);

    // Validate badge exists
    const badge = await this.badgeRepository.findOne(badgeId);
    if (!badge) {
      throw new NotFoundException('Badge not found.');
    }

    try {
      const userBadge = await this.userBadgeRepository.awardBadge(userId, badgeId);
      this.logger.log(`Badge ${badgeId} awarded to user ${userId} by ${user.id}`);
      return this.transformToEntity(userBadge);
    } catch (error) {
      this.logger.error(`Failed to award badge: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to award badge.');
    }
  }

  private validateViewAllPermission(userRole: string): void {
    if (userRole !== RoleName.Admin && userRole !== RoleName.Coach) {
      throw new ForbiddenException('Only Admin and Coach can view all user badges.');
    }
  }

  private validateAwardPermission(userRole: string): void {
    if (userRole !== RoleName.Admin && userRole !== RoleName.Coach) {
      throw new ForbiddenException('Only Admin and Coach can award badges.');
    }
  }

  private transformToEntity(dbUserBadge: any): UserBadge {
    return {
      id: dbUserBadge.id,
      user_id: dbUserBadge.user_id,
      badge_id: dbUserBadge.badge_id,
      awarded_at: dbUserBadge.awarded_at,
      is_active: dbUserBadge.is_active,
      created_at: dbUserBadge.created_at,
      updated_at: dbUserBadge.updated_at,
      badge: dbUserBadge.badge,
      user: dbUserBadge.user,
    };
  }
}