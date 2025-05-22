import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.use(compression())
  app.use(cookieParser())
  app.use(
    graphqlUploadExpress({
      maxFileSize: 10000000, // 10MB
      maxFiles: 5,
    }),
  )
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
