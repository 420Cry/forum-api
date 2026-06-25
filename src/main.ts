import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { EnvService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);

  app.enableCors({
    origin: env.getCorsOrigins(),
    credentials: true,
  });
  await app.listen(env.getPort(), '0.0.0.0');
}
void bootstrap();
