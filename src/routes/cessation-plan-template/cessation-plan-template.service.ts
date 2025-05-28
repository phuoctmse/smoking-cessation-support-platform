import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { CessationPlanTemplateRepository } from './cessation-plan-template.repository';
import { CreateCessationPlanTemplateType } from './schema/create-cessation-plan-template.schema';
import { UpdateCessationPlanTemplateType } from './schema/update-cessation-plan-template.schema';
import { PaginationParamsType } from '../../shared/models/pagination.model';
import { RoleName } from '../../shared/constants/role.constant';

@Injectable()
export class CessationPlanTemplateService {
  private readonly logger = new Logger(CessationPlanTemplateService.name);

  constructor(
      private readonly cessationPlanTemplateRepository: CessationPlanTemplateRepository,
  ) {}

  async findAll(params: PaginationParamsType, filters?: {
    difficulty_level?: string;
    is_active?: boolean;
  }) {
    return this.cessationPlanTemplateRepository.findAll(params, filters);
  }

  async findOne(id: string) {
    const template = await this.cessationPlanTemplateRepository.findOne(id);

    if (!template) {
      throw new NotFoundException('Cessation plan template not found');
    }

    return template;
  }

  async create(data: CreateCessationPlanTemplateType, userRole: string) {
    if (userRole !== RoleName.Coach) {
      throw new ConflictException('Only coaches can create cessation plan templates');
    }

    if (!data.name) {
      throw new ConflictException('Template name is required');
    }

    const existingTemplate = await this.cessationPlanTemplateRepository.findByName(data.name);
    if (existingTemplate) {
      throw new ConflictException('Template name already exists');
    }

    const template = await this.cessationPlanTemplateRepository.create(data);
    this.logger.log(`Cessation plan template created: ${template.id}`);
    return template;
  }

  async update(id: string, data: Omit<UpdateCessationPlanTemplateType, 'id'>, userRole: string) {
    if (userRole !== RoleName.Coach) {
      throw new ConflictException('Only coaches can update cessation plan templates');
    }

    const existingTemplate = await this.cessationPlanTemplateRepository.findOne(id);
    if (!existingTemplate) {
      throw new NotFoundException('Cessation plan template not found');
    }

    if (data.name && data.name !== existingTemplate.name) {
      const templateWithSameName = await this.cessationPlanTemplateRepository.findByName(data.name);
      if (templateWithSameName) {
        throw new ConflictException('Template name already exists');
      }
    }

    const template = await this.cessationPlanTemplateRepository.update(id, data);
    this.logger.log(`Cessation plan template updated: ${template.id}`);
    return template;
  }

  async remove(id: string, userRole: string) {
    if (userRole !== RoleName.Coach) {
      throw new ConflictException('Only coach can delete cessation plan templates');
    }

    const existingTemplate = await this.cessationPlanTemplateRepository.findOne(id);
    if (!existingTemplate) {
      throw new NotFoundException('Cessation plan template not found');
    }

    const template = await this.cessationPlanTemplateRepository.softDelete(id);
    this.logger.log(`Cessation plan template deleted: ${template.id}`);
    return template;
  }
}