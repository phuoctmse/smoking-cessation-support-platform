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
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { RolesGuard } from './shared/guards/roles.guard'
import { BlogModule } from './routes/blog/blog.module'
import * as process from 'node:process'
import { ConfigModule } from '@nestjs/config'
import { PerformanceInterceptor } from './shared/interceptors/performance.interceptor'
import CustomZodValidationPipe from './shared/pipes/custom-zod-validation.pipe'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { UploadScalar } from './shared/scalars/upload.scalar'

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }) => ({ req }),
    }),
    UserModule,
    AuthModule,
    BlogModule,
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
