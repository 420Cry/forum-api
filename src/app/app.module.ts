import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../modules/auth';
import { HealthModule } from '../modules/health';
import { RootModule } from '../modules/root';
import { EnvModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from 'src/modules/users/users.module';
import { FiltersModule } from 'src/filters/filters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    EnvModule,
    FiltersModule,
    DatabaseModule,
    AuthModule,
    RootModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
