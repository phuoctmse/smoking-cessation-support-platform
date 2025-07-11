import './shared/enums/graphql-enums'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from './shared/shared.module'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { join } from 'path'
import { UserModule } from './routes/user/user.module'
import { AuthModule } from './routes/auth/auth.module'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { BlogModule } from './routes/blog/blog.module'
import * as process from 'node:process'
import { ConfigModule } from '@nestjs/config'
import CustomZodValidationPipe from './shared/pipes/custom-zod-validation.pipe'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { UploadScalar } from './shared/scalars/upload.scalar'
import { CessationPlanTemplateModule } from './routes/cessation-plan-template/cessation-plan-template.module'
import { MembershipModule } from './routes/membership-package/membership.module'
import { PlanStageTemplateModule } from './routes/plan-stage-template/plan-stage-template.module'
import { CessationPlanModule } from './routes/cessation-plan/cessation-plan.module'
import { PlanStageModule } from './routes/plan-stage/plan-stage.module'
import { ProgressRecordModule } from './routes/progress-record/progress-record.module';
import { FeedbackModule } from './routes/feedback/feedback.module';
import { BadgeModule } from './routes/badge/badge.module';
import { BadgeTypeModule } from './routes/badge-type/badge-type.module';
import { TransactionModule } from './routes/transaction/transaction.module';
import { PaymentModule } from './routes/payment/payment.module'
import { SubscriptionModule } from './routes/subscription/subscription.module'
import { UserBadgeModule } from './routes/user-badge/user-badge.module';
import { BadgeAwardModule } from './routes/badge-award/badge-award.module';
import { SharedPostModule } from './routes/shared-post/shared-post.module';
import { PostLikeModule } from './routes/post-like/post-like.module';
import { PostCommentModule } from './routes/post-comment/post-comment.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './routes/chat/chat.module';
import { createWebSocketContext } from './shared/config/websocket.config';
import { PrismaService } from './shared/services/prisma.service';
import { SupabaseModule } from './shared/modules/supabase.module';
import { LeaderboardModule } from './routes/leaderboard/leaderboard.module'
import { ProfileQuizModule } from './routes/profile-quiz/profile-quiz.module'
import { QuizQuestionModule } from './routes/quiz-question/quiz-question.module'
import { QuizResponseModule } from './routes/quiz-response/quiz-reponse.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [SupabaseModule],
      inject: ['SUPABASE', PrismaService],
      useFactory: (supabase, prisma) => {
        const wsContext = createWebSocketContext(supabase, prisma);
        return {
          playground: false,
          plugins: [ApolloServerPluginLandingPageLocalDefault({ includeCookies: true })],
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          context: ({ req }) => ({ req }),
          cache: 'bounded',
          subscriptions: {
            'graphql-ws': {
              onConnect: async (context: any) => {
                const { connectionParams } = context;
                const { user } = await wsContext.subscriptionContextBuilder(context);
                console.log('Client connected');
                return { user };
              },
              onDisconnect: () => {
                console.log('Client disconnected');
              },
            },
            'subscriptions-transport-ws': false,
          },
        };
      },
    }),
    // ThrottlerModule.forRoot({
    //   throttlers: [
    //     {
    //       ttl: 60000,
    //       limit: 10,
    //       skipIf: (context) => {
    //         const request = GqlExecutionContext.create(context).getContext().req;
    //         const apiKey = request.headers['x-api-key'];
    //         return apiKey === envConfig.API_KEY;
    //       },
    //     },
    //   ],
    // }),
    UserModule,
    AuthModule,
    BlogModule,
    CessationPlanTemplateModule,
    MembershipModule,
    PlanStageTemplateModule,
    CessationPlanModule,
    PlanStageModule,
    ProgressRecordModule,
    FeedbackModule,
    BadgeModule,
    BadgeTypeModule,
    TransactionModule,
    PaymentModule,
    SubscriptionModule,
    UserBadgeModule,
    BadgeAwardModule,
    SharedPostModule,
    PostLikeModule,
    PostCommentModule,
    ChatModule,
    LeaderboardModule,
    ProfileQuizModule,
    QuizQuestionModule,
    QuizResponseModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [
    UploadScalar,
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard
    // }
  ],
})
export class AppModule { }