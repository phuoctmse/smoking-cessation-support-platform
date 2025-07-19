import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  constructor(private readonly configService: ConfigService) {
    // Sentry is already initialized in instrument.ts
    this.logger.log('🎯 SentryService initialized');
  }

  // ===== ERROR TRACKING =====

  captureException(error: Error, context?: string, extra?: Record<string, any>): void {
    Sentry.withScope(scope => {
      if (context) {
        scope.setTag('context', context);
      }
      
      if (extra) {
        Object.keys(extra).forEach(key => {
          scope.setExtra(key, extra[key]);
        });
      }
      
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', extra?: Record<string, any>): void {
    Sentry.withScope(scope => {
      if (extra) {
        Object.keys(extra).forEach(key => {
          scope.setExtra(key, extra[key]);
        });
      }
      
      Sentry.captureMessage(message, level);
    });
  }

  // ===== PERFORMANCE MONITORING =====

  startTransaction(name: string, operation: string): any {
    return Sentry.startSpan({
      name,
      op: operation,
    }, (span) => span);
  }

  // ===== ELASTICSEARCH SPECIFIC MONITORING =====

  captureElasticsearchError(error: Error, operation: string, indexName?: string): void {
    this.captureException(error, 'elasticsearch', {
      operation,
      indexName,
      elasticsearchError: true,
    });
  }

  captureDataSyncError(error: Error, syncType: string, recordsProcessed?: number): void {
    this.captureException(error, 'data-sync', {
      syncType,
      recordsProcessed,
      dataSyncError: true,
    });
  }

  captureCronJobError(error: Error, jobName: string, lastRun?: Date): void {
    this.captureException(error, 'cron-job', {
      jobName,
      lastRun,
      cronJobError: true,
    });
  }

  // ===== BUSINESS LOGIC MONITORING =====

  captureTemplateSearchError(error: Error, keyword: string, filters?: any): void {
    this.captureException(error, 'template-search', {
      keyword,
      filters,
      searchError: true,
    });
  }

  captureUserActionError(error: Error, userId: string, action: string): void {
    this.captureException(error, 'user-action', {
      userId,
      action,
      userActionError: true,
    });
  }

  // ===== PERFORMANCE METRICS =====

  recordPerformanceMetric(metricName: string, value: number, tags?: Record<string, string>): void {
    Sentry.addBreadcrumb({
      message: `Performance metric: ${metricName}`,
      level: 'info',
      data: {
        metric: metricName,
        value,
        ...tags,
      },
    });
  }

  // ===== USER CONTEXT =====

  setUserContext(userId: string, email?: string, role?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      role,
    });
  }

  clearUserContext(): void {
    Sentry.setUser(null);
  }

  // ===== CUSTOM TAGS =====

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  setTags(tags: Record<string, string>): void {
    Sentry.setTags(tags);
  }

  // ===== BREADCRUMBS =====

  addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  // ===== HEALTH CHECK =====

  checkSentryHealth(): {
    configured: boolean;
    dsn?: string;
    environment?: string;
    error?: string;
  } {
    try {
      const dsn = this.configService.get<string>('SENTRY_DSN');
      const environment = this.configService.get<string>('NODE_ENV', 'development');
      
      if (!dsn) {
        return {
          configured: false,
          error: 'Sentry DSN not configured',
        };
      }

      // Test Sentry connection
      Sentry.captureMessage('Health check test', 'info');
      
      return {
        configured: true,
        dsn: dsn.substring(0, 20) + '...' + dsn.substring(dsn.length - 10), // Mask DSN
        environment,
      };
    } catch (error) {
      return {
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
