import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { EnvService } from './config/config.service'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const env = app.get(EnvService)

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  app.enableCors({
    origin: env.getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With',
      'apikey',
      'x-client-info',
      // Playwright / tooling probes (harmless if unused by the API)
      'X-Forum-E2E',
    ],
  })
  await app.listen(env.getPort(), '0.0.0.0')
}
void bootstrap()
