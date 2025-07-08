import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class DashboardService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async getSystemStats() {
    const clusterHealth = await this.elasticsearchService.cluster.health();
    const indicesStats = await this.elasticsearchService.indices.stats();
    
    return {
      clusterStatus: clusterHealth.status,
      numberOfNodes: clusterHealth.number_of_nodes,
      activeShards: clusterHealth.active_shards,
      totalIndices: Object.keys(indicesStats.indices || {}).length,
      totalDocuments: indicesStats._all.total.docs.count,
      totalSize: indicesStats._all.total.store.size_in_bytes
    };
  }

  async getRecentLogs(limit: number = 100) {
    const response = await this.elasticsearchService.search({
      index: 'logs-*',
      body: {
        size: limit,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: {
          match_all: {}
        }
      }
    });

    return response.hits.hits.map(hit => ({
      timestamp: hit._source['@timestamp'],
      level: hit._source.level,
      message: hit._source.message,
      service: hit._source.service,
      score: hit._score,
      traceId: hit._source.trace_id,
      userId: hit._source.user_id,
      path: hit._source.path,
      method: hit._source.method
    }));
  }

  async getErrorStats(timeRange: string = '24h') {
    const now = new Date();
    const response = await this.elasticsearchService.search({
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
      errorOverTime: response.aggregations.errors_over_time.buckets,
      errorByService: response.aggregations.errors_by_service.buckets
    };
  }

  async searchLogs(query: string, timeRange: string = '24h') {
    const { hits } = await this.elasticsearchService.search({
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

    return hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score
    }));
  }
} 