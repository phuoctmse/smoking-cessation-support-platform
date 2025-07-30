import { Injectable, Logger } from '@nestjs/common';
import { TemplateMatchingResultRepository, MatchingResultReasoning } from './template-matching-result.repository';
import { TemplateMatchingResultSummary, RecommendationLevel } from './entities/template-matching-result.entity';

@Injectable()
export class TemplateMatchingResultService {
  private readonly logger = new Logger(TemplateMatchingResultService.name);

  constructor(
    private readonly templateMatchingResultRepository: TemplateMatchingResultRepository
  ) {}

  private getRecommendationLevel(confidence: number): RecommendationLevel {
    if (confidence >= 0.8) return RecommendationLevel.HIGH;
    if (confidence >= 0.6) return RecommendationLevel.MEDIUM;
    return RecommendationLevel.LOW;
  }

  async saveTemplateMatchingResult(
    userId: string,
    templateId: string,
    matchingScore: number,
    reasoning: MatchingResultReasoning,
    recommendationLevel?: string
  ): Promise<void> {
    try {
      // Convert confidence (0-1) to matching score (0-100)
      const score = Math.round(matchingScore * 100);
      
      // Determine recommendation level if not provided
      const level = recommendationLevel || this.getRecommendationLevel(matchingScore);

      await this.templateMatchingResultRepository.upsert(
        userId,
        templateId,
        score,
        reasoning,
        level
      );

      this.logger.debug(`Saved template matching result: User ${userId}, Template ${templateId}, Score: ${score}, Level: ${level}`);
    } catch (error) {
      this.logger.error('Error saving template matching result:', error);
      // Don't throw error to avoid breaking the main recommendation flow
    }
  }

  async getUserTemplateMatchingResults(userId: string): Promise<TemplateMatchingResultSummary[]> {
    try {
      return await this.templateMatchingResultRepository.findUserResults(userId);
    } catch (error) {
      this.logger.error('Error fetching user template matching results:', error);
      return [];
    }
  }

  async getUserTemplateMatchingResultsByUserId(userId: string): Promise<TemplateMatchingResultSummary[]> {
    return this.getUserTemplateMatchingResults(userId);
  }

  async getTemplateMatchingResultDetails(id: string): Promise<TemplateMatchingResultSummary | null> {
    try {
      return await this.templateMatchingResultRepository.findById(id);
    } catch (error) {
      this.logger.error('Error fetching template matching result details:', error);
      return null;
    }
  }
}
