import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../modules/auth';
import { HealthModule } from '../modules/health';
import { RootModule } from '../modules/root';

@Module({
  imports: [DatabaseModule, AuthModule, RootModule, HealthModule],
})
export class AppModule {}
