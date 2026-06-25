import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../modules/auth';
import { HealthModule } from '../modules/health';
import { RootModule } from '../modules/root';
import { EnvModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    EnvModule,
    DatabaseModule,
    AuthModule,
    RootModule,
    HealthModule,
  ],
})
export class AppModule {}
