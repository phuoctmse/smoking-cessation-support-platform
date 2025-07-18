import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

export interface CessationPlanDocument {
  id: string;
  user_id: string;
  template_id: string;
  status: string;
  created_at: Date;
  completed_at?: Date;
}

export interface CessationPlanTemplateDocument {
  id: string;
  title: string;
  description?: string;
  duration_weeks: number;
  difficulty_level: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  average_rating?: number;
  total_reviews?: number;
  price?: number;
  category?: string;
  tags?: string[];
}

@Injectable()
export class CustomElasticsearchService {
  private readonly logger = new Logger(CustomElasticsearchService.name);
  private readonly indexPrefix: string;

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {
    this.indexPrefix = this.configService.get('ELASTICSEARCH_INDEX_PREFIX', 'smoking_cessation');
    
    // Test connection on startup
    void this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      this.logger.log('🔌 Attempting to connect to Elasticsearch...');
      
      const isConnected = await this.ping();
      if (isConnected) {
        this.logger.log('✅ Successfully connected to Elasticsearch');
        
        // Log cluster info
        const clusterHealth = await this.getClusterHealth();
        this.logger.log(`📊 Cluster: ${clusterHealth.cluster_name} | Status: ${clusterHealth.status}`);
        
        // Auto-create indices on startup
        await this.createIndicesIfNotExist();
      } else {
        this.logger.error('❌ Failed to connect to Elasticsearch');
      }
    } catch (error) {
      this.logger.error('❌ Elasticsearch connection error:', error.message);
    }
  }

  // ===== INDEX MANAGEMENT =====

  async createIndicesIfNotExist(): Promise<void> {
    try {
      await this.createCessationPlansIndex();
      await this.createCessationPlanTemplatesIndex();
      this.logger.log('Elasticsearch indices created successfully');
    } catch (error) {
      this.logger.error('Failed to create Elasticsearch indices:', error);
    }
  }


  private async createCessationPlansIndex(): Promise<void> {
    const indexName = `${this.indexPrefix}_cessation_plans`;
    
    const exists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (!exists) {
      await this.elasticsearchService.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              user_id: { type: 'keyword' },
              template_id: { type: 'keyword' },
              status: { type: 'keyword' },
              created_at: { type: 'date' },
              completed_at: { type: 'date' },
            },
          },
        },
      } as any);
      this.logger.log(`Created index: ${indexName}`);
    }
  }

  private async createCessationPlanTemplatesIndex(): Promise<void> {
    const indexName = `${this.indexPrefix}_cessation_plan_templates`;
    
    const exists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (!exists) {
      await this.elasticsearchService.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text', analyzer: 'standard' },
              description: { type: 'text', analyzer: 'standard' },
              duration_weeks: { type: 'integer' },
              difficulty_level: { type: 'keyword' },
              is_active: { type: 'boolean' },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
              average_rating: { type: 'float' },
              total_reviews: { type: 'integer' },
              price: { type: 'float' },
              category: { type: 'keyword' },
              tags: { type: 'keyword' },
            },
          },
        },
      } as any);
      this.logger.log(`Created index: ${indexName}`);
    }
  }

  // ===== CESSATION PLAN OPERATIONS =====

  async indexCessationPlan(plan: CessationPlanDocument): Promise<void> {
    const indexName = `${this.indexPrefix}_cessation_plans`;
    
    try {
      await this.elasticsearchService.index({
        index: indexName,
        id: plan.id,
        body: plan,
      } as any);
      this.logger.log(`Indexed cessation plan: ${plan.id}`);
    } catch (error) {
      this.logger.error(`Failed to index cessation plan:`, error);
      throw error;
    }
  }

  async searchCessationPlans(query: any): Promise<CessationPlanDocument[]> {
    const indexName = `${this.indexPrefix}_cessation_plans`;
    
    try {
      const response = await this.elasticsearchService.search({
        index: indexName,
        body: query,
      });

      return response.hits.hits.map(hit => hit._source as CessationPlanDocument);
    } catch (error) {
      this.logger.error('Failed to search cessation plans:', error);
      throw error;
    }
  }

  // ===== CESSATION PLAN TEMPLATE OPERATIONS =====

  async indexCessationPlanTemplate(template: CessationPlanTemplateDocument): Promise<void> {
    const indexName = `${this.indexPrefix}_cessation_plan_templates`;
    
    try {
      await this.elasticsearchService.index({
        index: indexName,
        id: template.id,
        body: template,
      } as any);
      this.logger.log(`Indexed cessation plan template: ${template.id}`);
    } catch (error) {
      this.logger.error(`Failed to index cessation plan template:`, error);
      throw error;
    }
  }

  async searchCessationPlanTemplates(query: any): Promise<CessationPlanTemplateDocument[]> {
    const indexName = `${this.indexPrefix}_cessation_plan_templates`;
    
    try {
      const response = await this.elasticsearchService.search({
        index: indexName,
        body: query,
      });

      return response.hits.hits.map(hit => hit._source as CessationPlanTemplateDocument);
    } catch (error) {
      this.logger.error('Failed to search cessation plan templates:', error);
      throw error;
    }
  }

  async getCessationPlanTemplate(templateId: string): Promise<CessationPlanTemplateDocument | null> {
    const indexName = `${this.indexPrefix}_cessation_plan_templates`;
    
    try {
      const response = await this.elasticsearchService.get({
        index: indexName,
        id: templateId,
      });

      return response._source as CessationPlanTemplateDocument;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      this.logger.error(`Failed to get cessation plan template:`, error);
      throw error;
    }
  }

  async searchTemplatesByKeyword(keyword: string, filters: {
    difficulty_level?: string;
    min_rating?: number;
    max_price?: number;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    templates: CessationPlanTemplateDocument[];
    total: number;
  }> {
    const indexName = `${this.indexPrefix}_cessation_plan_templates`;
    
    try {
      const must: any[] = [];
      
      // Text search
      if (keyword && keyword.trim()) {
        must.push({
          multi_match: {
            query: keyword,
            fields: ['title^2', 'description'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Filters
      if (filters.difficulty_level) {
        must.push({ term: { difficulty_level: filters.difficulty_level } });
      }
      
      if (filters.is_active !== undefined) {
        must.push({ term: { is_active: filters.is_active } });
      }

      if (filters.min_rating) {
        must.push({ range: { average_rating: { gte: filters.min_rating } } });
      }

      if (filters.max_price) {
        must.push({ range: { price: { lte: filters.max_price } } });
      }

      const query = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }]
          }
        },
        sort: [
          { average_rating: { order: 'desc' } },
          { total_reviews: { order: 'desc' } },
          { created_at: { order: 'desc' } }
        ],
        from: filters.offset || 0,
        size: filters.limit || 20
      };

      const response = await this.elasticsearchService.search({
        index: indexName,
        body: query,
      } as any);

      return {
        templates: response.hits.hits.map(hit => hit._source as CessationPlanTemplateDocument),
        total: typeof response.hits.total === 'object' ? response.hits.total.value : response.hits.total
      };
    } catch (error) {
      this.logger.error('Failed to search templates by keyword:', error);
      throw error;
    }
  }

  // ===== HEALTH CHECK =====

  async ping(): Promise<boolean> {
    try {
      await this.elasticsearchService.ping();
      return true;
    } catch (error) {
      this.logger.error('Elasticsearch ping failed:', error);
      return false;
    }
  }

  async getClusterHealth(): Promise<any> {
    try {
      const response = await this.elasticsearchService.cluster.health();
      return response;
    } catch (error) {
      this.logger.error('Failed to get cluster health:', error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    cluster_name?: string;
    status?: string;
    number_of_nodes?: number;
    error?: string;
  }> {
    try {
      const isConnected = await this.ping();
      
      if (!isConnected) {
        return { connected: false, error: 'Ping failed' };
      }

      const clusterHealth = await this.getClusterHealth();
      
      return {
        connected: true,
        cluster_name: clusterHealth.cluster_name,
        status: clusterHealth.status,
        number_of_nodes: clusterHealth.number_of_nodes,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}
