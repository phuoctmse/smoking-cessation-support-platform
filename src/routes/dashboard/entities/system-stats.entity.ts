import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class DatabaseTableStats {
  @Field(() => String)
  tableName: string;

  @Field(() => Int)
  totalRecords: number;

  @Field(() => Int)
  activeRecords: number;

  @Field(() => Int)
  deletedRecords: number;
}

@ObjectType()
export class SystemStats {
  // Elasticsearch stats
  @Field()
  clusterStatus: string;

  @Field(() => Int)
  numberOfNodes: number;

  @Field(() => Int)
  activeShards: number;

  @Field(() => Int)
  totalIndices: number;

  @Field(() => Int)
  totalDocuments: number;

  @Field(() => Float)
  totalSize: number;

  // User related stats
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalAdmins: number;

  @Field(() => Int)
  totalCoaches: number;

  @Field(() => Int)
  totalMembers: number;

  // Cessation Plan stats
  @Field(() => Int)
  totalCessationPlans: number;

  @Field(() => Int)
  totalActiveCessationPlans: number;

  @Field(() => Int)
  totalCompletedCessationPlans: number;

  @Field(() => Int)
  totalAbandonedCessationPlans: number;

  @Field(() => Int)
  totalCancelledCessationPlans: number;

  // Plan Stage stats
  @Field(() => Int)
  totalPlanStages: number;

  @Field(() => Int)
  totalPlanStageTemplates: number;

  // Progress stats
  @Field(() => Int)
  totalProgressRecords: number;

  // Subscription and Payment stats
  @Field(() => Int)
  totalMembershipPackages: number;

  @Field(() => Int)
  totalActiveSubscriptions: number;

  @Field(() => Int)
  totalExpiredSubscriptions: number;

  @Field(() => Int)
  totalPayments: number;

  @Field(() => Float)
  totalRevenue: number;

  // Social features stats
  @Field(() => Int)
  totalBlogPosts: number;

  @Field(() => Int)
  totalComments: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Int)
  totalShares: number;

  // Badge system stats
  @Field(() => Int)
  totalBadges: number;

  @Field(() => Int)
  totalBadgeTypes: number;

  @Field(() => Int)
  totalUserBadges: number;

  // Feedback stats
  @Field(() => Int)
  totalFeedback: number;

  @Field(() => Int)
  totalAnonymousFeedback: number;

  // Chat stats
  @Field(() => Int)
  totalChatMessages: number;

  @Field(() => Int)
  totalChatRooms: number;

  // Detailed table statistics
  @Field(() => [DatabaseTableStats])
  tableStats: DatabaseTableStats[];
} 