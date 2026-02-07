import { Module } from '@nestjs/common';
import { HealthModule } from '../modules/health';
import { RootModule } from '../modules/root';

@Module({
  imports: [RootModule, HealthModule],
})
export class AppModule {}
