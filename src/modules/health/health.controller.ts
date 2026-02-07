import { Controller, Get, Inject } from '@nestjs/common';
import { HEALTH_SERVICE, HealthServiceToken } from './health.service.interface';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HEALTH_SERVICE) private readonly healthService: HealthServiceToken,
  ) {}

  @Get()
  getHealth() {
    return this.healthService.getStatus();
  }
}
