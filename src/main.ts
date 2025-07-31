import './instrument';
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import envConfig from './shared/config/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.enableCors({
    origin: [envConfig.FRONTEND_URL],
  })
  app.use(compression())
  app.use(cookieParser())
  app.use(
    graphqlUploadExpress({
      maxFileSize: 10000000, // 10MB
      maxFiles: 5,
    }),
  )
  app.setGlobalPrefix('api')
  
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch(console.error)