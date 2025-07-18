import { Controller, Get, Post, Param } from '@nestjs/common';
import { CustomElasticsearchService } from '../services/elasticsearch.service';
import { DataSyncService } from '../services/data-sync.service';
import { CronJobManagementService } from '../services/cronjob-management.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly elasticsearchService: CustomElasticsearchService,
    private readonly dataSyncService: DataSyncService,
    private readonly cronJobManagementService: CronJobManagementService,
  ) {}

  @Get('elasticsearch')
  async checkElasticsearch() {
    const status = await this.elasticsearchService.getConnectionStatus();
    
    return {
      service: 'Elasticsearch',
      timestamp: new Date().toISOString(),
      ...status,
    };
  }

  @Get('all')
  async checkAll() {
    const elasticsearch = await this.elasticsearchService.getConnectionStatus();
    
    return {
      services: {
        elasticsearch,
      },
      timestamp: new Date().toISOString(),
      overall_status: elasticsearch.connected ? 'healthy' : 'unhealthy',
    };
  }


  @Post('sync/plans')
  async syncPlans() {
    try {
      await this.dataSyncService.syncAllCessationPlans();
      return {
        success: true,
        message: 'Cessation plans synced successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sync cessation plans',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('sync/templates')
  async syncTemplates() {
    try {
      const result = await this.dataSyncService.syncAllCessationPlanTemplates();
      return {
        success: true,
        message: 'Cessation plan templates synced successfully',
        synced: result.synced,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sync cessation plan templates',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('sync/all')
  async syncAll() {
    try {
      await this.dataSyncService.syncAllData();
      return {
        success: true,
        message: 'All data synced successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sync all data',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('sync/verify')
  async verifyConsistency() {
    try {
      const consistency = await this.dataSyncService.verifyDataConsistency();
      return {
        success: true,
        data: consistency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify data consistency',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ===== CRON JOB MANAGEMENT =====

  @Get('cron-jobs')
  getCronJobs() {
    try {
      const jobs = this.cronJobManagementService.getCronJobs();
      return {
        success: true,
        data: jobs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get cron jobs',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('cron-jobs/:name/start')
  startCronJob(@Param('name') name: string) {
    try {
      this.cronJobManagementService.startCronJob(name);
      return {
        success: true,
        message: `Cron job '${name}' started successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to start cron job '${name}'`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('cron-jobs/:name/stop')
  stopCronJob(@Param('name') name: string) {
    try {
      this.cronJobManagementService.stopCronJob(name);
      return {
        success: true,
        message: `Cron job '${name}' stopped successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop cron job '${name}'`,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
