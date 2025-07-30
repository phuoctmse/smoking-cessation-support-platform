import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateTemplateMatchingResultInput, UpdateTemplateMatchingResultInput } from './dto/template-matching-result.dto';
import { TemplateMatchingResultSummary } from './entities/template-matching-result.entity';
import { TemplateMatchingResult as PrismaTemplateMatchingResult } from '@prisma/client';

export interface MatchingResultReasoning {
  matchingFactors: string[];
  considerations: string[];
  risks: string[];
  suggestions: string[];
}

@Injectable()
export class TemplateMatchingResultRepository {
  private readonly logger = new Logger(TemplateMatchingResultRepository.name);

  constructor(private prisma: PrismaService) {}

  async create(data: CreateTemplateMatchingResultInput): Promise<PrismaTemplateMatchingResult> {
    try {
      return await this.prisma.templateMatchingResult.create({
        data
      });
    } catch (error) {
      this.logger.error('Error creating template matching result:', error);
      throw error;
    }
  }

  async findByUserAndTemplate(userId: string, templateId: string): Promise<any> {
    try {
      return await this.prisma.templateMatchingResult.findFirst({
        where: {
          user_id: userId,
          template_id: templateId
        }
      });
    } catch (error) {
      this.logger.error('Error finding template matching result:', error);
      return null;
    }
  }

  async update(id: string, data: UpdateTemplateMatchingResultInput): Promise<PrismaTemplateMatchingResult> {
    try {
      return await this.prisma.templateMatchingResult.update({
        where: { id },
        data
      });
    } catch (error) {
      this.logger.error('Error updating template matching result:', error);
      throw error;
    }
  }

  async findUserResults(userId: string): Promise<TemplateMatchingResultSummary[]> {
    try {
      const results = await this.prisma.templateMatchingResult.findMany({
        where: {
          user_id: userId
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
              is_active: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return results.map(result => ({
        id: result.id,
        template: result.template,
        matchingScore: result.matching_score,
        matchingFactors: result.matching_factors,
        recommendationLevel: result.recommendation_level,
        createdAt: result.created_at
      }));
    } catch (error) {
      this.logger.error('Error fetching user template matching results:', error);
      return [];
    }
  }

  async findById(id: string): Promise<TemplateMatchingResultSummary | null> {
    try {
      const result = await this.prisma.templateMatchingResult.findUnique({
        where: { id },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true,
              is_active: true
            }
          }
        }
      });

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        template: result.template,
        matchingScore: result.matching_score,
        matchingFactors: result.matching_factors,
        recommendationLevel: result.recommendation_level,
        createdAt: result.created_at
      };
    } catch (error) {
      this.logger.error('Error fetching template matching result by id:', error);
      return null;
    }
  }

  async upsert(
    userId: string,
    templateId: string,
    matchingScore: number,
    reasoning: MatchingResultReasoning,
    recommendationLevel: string
  ): Promise<PrismaTemplateMatchingResult> {
    try {
      const matchingFactors = {
        confidence: matchingScore / 100, // Convert back to 0-1 range
        reasoning: reasoning,
        timestamp: new Date().toISOString(),
        source: 'AI_GEMINI'
      };

      const existingRecord = await this.findByUserAndTemplate(userId, templateId);

      if (existingRecord) {
        return await this.update(existingRecord.id, {
          matching_score: matchingScore,
          matching_factors: matchingFactors,
          recommendation_level: recommendationLevel
        });
      } else {
        return await this.create({
          user_id: userId,
          template_id: templateId,
          matching_score: matchingScore,
          matching_factors: matchingFactors,
          recommendation_level: recommendationLevel
        });
      }
    } catch (error) {
      this.logger.error('Error upserting template matching result:', error);
      throw error;
    }
  }
}
