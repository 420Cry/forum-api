import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HEALTH_SERVICE } from './health.service.interface';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: HEALTH_SERVICE,
      useClass: HealthService,
    },
  ],
})
export class HealthModule {}
