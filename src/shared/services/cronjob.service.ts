import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { DataSyncService } from './data-sync.service'
import { CustomElasticsearchService } from './elasticsearch.service'

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name)

  constructor(
    private readonly dataSyncService: DataSyncService,
    private readonly elasticsearchService: CustomElasticsearchService,
  ) {}

  // Sync data every day at 2 AM
  @Cron('0 2 * * *', {
    name: 'daily-elasticsearch-sync',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailySync() {
    this.logger.log('🔄 Starting daily Elasticsearch sync...')

    try {
      // Check Elasticsearch connection first
      const isConnected = await this.elasticsearchService.ping()
      if (!isConnected) {
        this.logger.error('❌ Elasticsearch is not connected, skipping sync')
        return
      }

      // Sync all data
      await this.dataSyncService.syncAllData()

      this.logger.log('✅ Daily Elasticsearch sync completed successfully')
    } catch (error) {
      this.logger.error('❌ Daily Elasticsearch sync failed:', error.message)
    }
  }

  // Sync cessation plan templates every 6 hours
  @Cron('0 */6 * * *', {
    name: 'template-sync',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleTemplateSyncEvery6Hours() {
    this.logger.log('📝 Starting template sync (every 6 hours)...')

    try {
      const isConnected = await this.elasticsearchService.ping()
      if (!isConnected) {
        this.logger.error('❌ Elasticsearch is not connected, skipping template sync')
        return
      }

      await this.dataSyncService.syncAllCessationPlanTemplates()

      this.logger.log('✅ Template sync completed successfully')
    } catch (error) {
      this.logger.error('❌ Template sync failed:', error.message)
    }
  }

  // Sync cessation plans every 2 hours
  @Cron('0 */2 * * *', {
    name: 'plans-sync',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handlePlansSyncEvery2Hours() {
    this.logger.log('📋 Starting plans sync (every 2 hours)...')

    try {
      const isConnected = await this.elasticsearchService.ping()
      if (!isConnected) {
        this.logger.error('❌ Elasticsearch is not connected, skipping plans sync')
        return
      }

      await this.dataSyncService.syncAllCessationPlans()

      this.logger.log('✅ Plans sync completed successfully')
    } catch (error) {
      this.logger.error('❌ Plans sync failed:', error.message)
    }
  }

  // Health check every 30 minutes
  @Cron('*/30 * * * *', {
    name: 'elasticsearch-health-check',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleElasticsearchHealthCheck() {
    try {
      const connectionStatus = await this.elasticsearchService.getConnectionStatus()

      if (connectionStatus.connected) {
        this.logger.log(`💚 Elasticsearch healthy: ${connectionStatus.cluster_name} (${connectionStatus.status})`)
      } else {
        this.logger.warn(`⚠️ Elasticsearch unhealthy: ${connectionStatus.error}`)
      }
    } catch (error) {
      this.logger.error('❌ Elasticsearch health check failed:', error.message)
    }
  }

  // Data consistency check every 12 hours
  @Cron('0 */12 * * *', {
    name: 'data-consistency-check',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDataConsistencyCheck() {
    this.logger.log('🔍 Starting data consistency check...')

    try {
      const isConnected = await this.elasticsearchService.ping()
      if (!isConnected) {
        this.logger.error('❌ Elasticsearch is not connected, skipping consistency check')
        return
      }

      const consistency = await this.dataSyncService.verifyDataConsistency()

      // Log consistency report
      this.logger.log('📊 Data Consistency Report:')
      this.logger.log(
        `- Plans: PostgreSQL=${consistency.postgres_plans}, Elasticsearch=${consistency.elasticsearch_plans}`,
      )
      this.logger.log(`- Overall Consistent: ${consistency.consistent}`)

      // Alert if data is inconsistent
      if (!consistency.consistent) {
        this.logger.warn('⚠️ Data inconsistency detected! Consider running manual sync.')
      } else {
        this.logger.log('✅ Data consistency check passed')
      }
    } catch (error) {
      this.logger.error('❌ Data consistency check failed:', error.message)
    }
  }
}
