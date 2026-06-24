import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth';
import { HealthModule } from '../modules/health';
import { RootModule } from '../modules/root';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule.forRoot(), AuthModule, RootModule, HealthModule],
})
export class AppModule {}
