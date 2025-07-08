import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchResponse, AggregationsAggregate } from '@elastic/elasticsearch/lib/api/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { CessationPlanStatus, Role, PaymentStatus } from '@prisma/client';
import { DatabaseTableStats } from './entities/system-stats.entity';

interface LogEntry {
  '@timestamp': string;
  level: string;
  message: string;
  service: string;
  trace_id?: string;
  user_id?: string;
  path?: string;
  method?: string;
}

interface ErrorAggregations {
  errors_over_time: AggregationsAggregate;
  errors_by_service: AggregationsAggregate;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly prisma: PrismaService
  ) {}

  private async getTableStats(tableName: string, whereClause: any = {}): Promise<DatabaseTableStats> {
    const totalRecords = await (this.prisma[tableName] as any).count();
    const activeRecords = await (this.prisma[tableName] as any).count({
      where: { is_deleted: false, ...whereClause }
    });
    const deletedRecords = await (this.prisma[tableName] as any).count({
      where: { is_deleted: true, ...whereClause }
    });

    return {
      tableName,
      totalRecords,
      activeRecords,
      deletedRecords
    };
  }

  async getSystemStats() {
    const [
      clusterHealth,
      indicesStats,
      // User stats
      totalUsers,
      usersByRole,
      // Cessation Plan stats
      cessationPlanStats,
      // Plan Stage stats
      planStageStats,
      planStageTemplateStats,
      // Progress stats
      progressRecordStats,
      // Subscription and Payment stats
      membershipPackageStats,
      subscriptionStats,
      paymentStats,
      totalRevenue,
      // Social features stats
      blogStats,
      commentStats,
      likeStats,
      shareStats,
      // Badge system stats
      badgeStats,
      badgeTypeStats,
      userBadgeStats,
      // Feedback stats
      feedbackStats,
      // Chat stats
      chatMessageStats,
      chatRoomStats
    ] = await Promise.all([
      // Elasticsearch stats
      this.elasticsearchService.cluster.health(),
      this.elasticsearchService.indices.stats(),

      // User counts
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),

      // Cessation Plan counts
      this.prisma.cessationPlan.groupBy({
        by: ['status'],
        _count: true,
        where: { is_deleted: false }
      }),

      // Plan Stage counts
      this.getTableStats('planStage'),
      this.getTableStats('planStageTemplate'),

      // Progress Record counts
      this.getTableStats('progressRecord'),

      // Subscription and Payment counts
      this.getTableStats('membershipPackage'),
      this.prisma.userSubscription.groupBy({
        by: ['status'],
        _count: true
      }),
      this.getTableStats('payment'),
      this.prisma.payment.aggregate({
        _sum: {
          price: true
        },
        where: {
          status: PaymentStatus.SUCCESS
        }
      }),

      // Social features counts
      this.getTableStats('blog'),
      this.getTableStats('postComment'),
      this.getTableStats('postLike'),
      this.getTableStats('sharedPost'),

      // Badge system counts
      this.getTableStats('badge'),
      this.getTableStats('badgeType'),
      this.getTableStats('userBadge'),

      // Feedback counts
      this.prisma.feedback.groupBy({
        by: ['is_anonymous'],
        _count: true
      }),

      // Chat counts
      this.getTableStats('chatMessage'),
      this.getTableStats('chatRoom')
    ]);

    // Process role counts
    const roleCount = usersByRole.reduce((acc, curr) => {
      acc[curr.role] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // Process cessation plan status counts
    const planStatusCount = cessationPlanStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // Process subscription status counts
    const subscriptionStatusCount = subscriptionStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // Process feedback counts
    const feedbackCount = feedbackStats.reduce((acc, curr) => {
      acc[curr.is_anonymous ? 'anonymous' : 'named'] = curr._count;
      return acc;
    }, { anonymous: 0, named: 0 });

    // Collect table statistics
    const tableStats = [
      await this.getTableStats('user'),
      await this.getTableStats('cessationPlan'),
      await this.getTableStats('planStage'),
      await this.getTableStats('planStageTemplate'),
      await this.getTableStats('progressRecord'),
      await this.getTableStats('membershipPackage'),
      await this.getTableStats('userSubscription'),
      await this.getTableStats('payment'),
      await this.getTableStats('blog'),
      await this.getTableStats('postComment'),
      await this.getTableStats('postLike'),
      await this.getTableStats('sharedPost'),
      await this.getTableStats('badge'),
      await this.getTableStats('badgeType'),
      await this.getTableStats('userBadge'),
      await this.getTableStats('feedback'),
      await this.getTableStats('chatMessage'),
      await this.getTableStats('chatRoom')
    ];
    
    return {
      // Elasticsearch stats
      clusterStatus: clusterHealth.status,
      numberOfNodes: clusterHealth.number_of_nodes,
      activeShards: clusterHealth.active_shards,
      totalSize: (indicesStats as any)._all?.total?.store?.size_in_bytes || 0,

      // User stats
      totalUsers,
      totalAdmins: roleCount[Role.ADMIN] || 0,
      totalCoaches: roleCount[Role.COACH] || 0,
      totalMembers: roleCount[Role.MEMBER] || 0,

      // Cessation Plan stats
      totalCessationPlans: planStatusCount.ACTIVE + planStatusCount.COMPLETED + planStatusCount.ABANDONED + planStatusCount.CANCELLED || 0,
      totalActiveCessationPlans: planStatusCount.ACTIVE || 0,
      totalCompletedCessationPlans: planStatusCount.COMPLETED || 0,
      totalAbandonedCessationPlans: planStatusCount.ABANDONED || 0,
      totalCancelledCessationPlans: planStatusCount.CANCELLED || 0,

      // Plan Stage stats
      totalPlanStages: planStageStats.totalRecords,
      totalPlanStageTemplates: planStageTemplateStats.totalRecords,

      // Progress stats
      totalProgressRecords: progressRecordStats.totalRecords,

      // Subscription and Payment stats
      totalMembershipPackages: membershipPackageStats.totalRecords,
      totalActiveSubscriptions: subscriptionStatusCount.ACTIVE || 0,
      totalExpiredSubscriptions: subscriptionStatusCount.EXPIRED || 0,
      totalPayments: paymentStats.totalRecords,
      totalRevenue: totalRevenue._sum.price || 0,

      // Social features stats
      totalBlogPosts: blogStats.totalRecords,
      totalComments: commentStats.totalRecords,
      totalLikes: likeStats.totalRecords,
      totalShares: shareStats.totalRecords,

      // Badge system stats
      totalBadges: badgeStats.totalRecords,
      totalBadgeTypes: badgeTypeStats.totalRecords,
      totalUserBadges: userBadgeStats.totalRecords,

      // Feedback stats
      totalFeedback: feedbackCount.named + feedbackCount.anonymous,
      totalAnonymousFeedback: feedbackCount.anonymous,

      // Chat stats
      totalChatMessages: chatMessageStats.totalRecords,
      totalChatRooms: chatRoomStats.totalRecords,

      // Table statistics
      tableStats
    };
  }

  async getRecentLogs(limit: number = 100) {
    const { hits } = await this.elasticsearchService.search<SearchResponse<LogEntry>>({
      index: 'logs-*',
      body: {
        size: limit,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: {
          match_all: {}
        }
      }
    });

    return hits.hits.map(hit => {
      const source = (hit._source as unknown) as LogEntry;
      return {
        timestamp: source['@timestamp'],
        level: source.level,
        message: source.message,
        service: source.service,
        score: hit._score,
        traceId: source.trace_id,
        userId: source.user_id,
        path: source.path,
        method: source.method
      };
    });
  }

  async getErrorStats(timeRange: string = '24h') {
    const { aggregations } = await this.elasticsearchService.search<SearchResponse<LogEntry, ErrorAggregations>>({
      index: 'logs-*',
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { match: { level: 'error' } },
              {
                range: {
                  '@timestamp': {
                    gte: `now-${timeRange}`,
                    lte: 'now'
                  }
                }
              }
            ]
          }
        },
        aggs: {
          errors_over_time: {
            date_histogram: {
              field: '@timestamp',
              fixed_interval: '1h'
            }
          },
          errors_by_service: {
            terms: {
              field: 'service.keyword',
              size: 10
            }
          }
        }
      }
    });

    return {
      errorOverTime: (aggregations?.errors_over_time as any)?.buckets || [],
      errorByService: (aggregations?.errors_by_service as any)?.buckets || []
    };
  }

  async searchLogs(query: string, timeRange: string = '24h') {
    const { hits } = await this.elasticsearchService.search<SearchResponse<LogEntry>>({
      index: 'logs-*',
      query: {
        bool: {
          must: [
            {
              range: {
                '@timestamp': {
                  gte: `now-${timeRange}`
                }
              }
            },
            {
              multi_match: {
                query: query,
                fields: ['message', 'service', 'level'],
                type: 'phrase_prefix'
              }
            }
          ]
        }
      },
      sort: [
        { '@timestamp': { order: 'desc' } }
      ],
      size: 100
    });

    return hits.hits.map(hit => {
      const source = (hit._source as unknown) as LogEntry;
      return {
        ...source,
        score: hit._score
      };
    });
  }
} 