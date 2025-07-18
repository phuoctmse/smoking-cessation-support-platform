import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomElasticsearchService } from './elasticsearch.service';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearchService: CustomElasticsearchService,
  ) {}

  /**
   * Sync tất cả cessation plans từ PostgreSQL sang Elasticsearch
   */
  async syncAllCessationPlans(): Promise<void> {
    try {
      this.logger.log('🔄 Starting bulk sync of cessation plans...');

      const plans = await this.prisma.cessationPlan.findMany({
        select: {
          id: true,
          user_id: true,
          template_id: true,
          status: true,
          created_at: true,
          updated_at: true,
        }
      });

      this.logger.log(`📊 Found ${plans.length} cessation plans to sync`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const plan of plans) {
        try {
          await this.elasticsearchService.indexCessationPlan({
            id: plan.id,
            user_id: plan.user_id,
            template_id: plan.template_id || '',
            status: plan.status,
            created_at: plan.created_at,
            completed_at: plan.status === 'COMPLETED' ? plan.updated_at : undefined,
          });

          syncedCount++;
          if (syncedCount % 100 === 0) {
            this.logger.log(`📈 Synced ${syncedCount}/${plans.length} plans...`);
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`❌ Failed to sync plan ${plan.id}:`, error.message);
        }
      }

      this.logger.log(`🎉 Bulk sync completed: ${syncedCount} success, ${errorCount} errors`);
    } catch (error) {
      this.logger.error('❌ Bulk sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync toàn bộ data
   */
  async syncAllData(): Promise<void> {
    this.logger.log('🚀 Starting full data synchronization...');
    
    await this.syncAllCessationPlanTemplates();
    await this.syncAllCessationPlans();
    
    this.logger.log('✅ Full data synchronization completed!');
  }

  /**
   * Verify data consistency giữa PostgreSQL và Elasticsearch
   */
  async verifyDataConsistency(): Promise<{
    postgres_plans: number;
    elasticsearch_plans: number;
    consistent: boolean;
  }> {
    try {
      // Count from PostgreSQL
      const pgPlanCount = await this.prisma.cessationPlan.count();

      const esPlanResponse = await  this.elasticsearchService.searchCessationPlans({
          query: { match_all: {} },
          size: 0
        })

      // Note: For actual count, we'd need to access the response.hits.total.value
      // This is a simplified version
      const esPlanCount = esPlanResponse.length;

      const result = {
        postgres_plans: pgPlanCount,
        elasticsearch_plans: esPlanCount,
        consistent: pgPlanCount === esPlanCount,
      };

      this.logger.log('📊 Data consistency check:', result);
      return result;
    } catch (error) {
      this.logger.error('❌ Data consistency check failed:', error);
      throw error;
    }
  }

  /**
   * Sync tất cả cessation plan templates từ PostgreSQL sang Elasticsearch
   */
  async syncAllCessationPlanTemplates(): Promise<{ synced: number; errors: number }> {
    try {
      this.logger.log('🔄 Starting bulk sync of cessation plan templates...');

      // Get all templates from PostgreSQL
      const templates = await this.prisma.cessationPlanTemplate.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          estimated_duration_days: true,
          difficulty_level: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          average_rating: true,
          total_reviews: true,
        }
      });

      this.logger.log(`📋 Found ${templates.length} templates to sync`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const template of templates) {
        try {
          await this.elasticsearchService.indexCessationPlanTemplate({
            id: template.id,
            title: template.name,
            description: template.description,
            duration_weeks: Math.ceil((template.estimated_duration_days || 0) / 7),
            difficulty_level: template.difficulty_level,
            is_active: template.is_active,
            created_at: template.created_at,
            updated_at: template.updated_at,
            average_rating: template.average_rating || 0,
            total_reviews: template.total_reviews || 0,
            price: 0, // Default price
          });

          syncedCount++;
          
          if (syncedCount % 10 === 0) {
            this.logger.log(`📋 Synced ${syncedCount}/${templates.length} templates...`);
          }
        } catch (error) {
          this.logger.error(`Failed to sync template ${template.id}:`, error);
          errorCount++;
        }
      }

      this.logger.log(`✅ Template sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { synced: syncedCount, errors: errorCount };
    } catch (error) {
      this.logger.error('❌ Failed to sync cessation plan templates:', error);
      throw error;
    }
  }
}
