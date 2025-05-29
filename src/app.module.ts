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

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ includeCookies: true })],
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }) => ({ req }),
      cache: 'bounded',
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
export class AppModule {}
