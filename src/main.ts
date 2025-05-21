import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import compression from 'compression'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.use(compression())
  app.use(cookieParser())
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
