import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../auth';
import { HEALTH_SERVICE, HealthServiceToken } from './health.service.interface';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    @Inject(HEALTH_SERVICE) private readonly healthService: HealthServiceToken,
  ) {}

  @Get()
  getHealth() {
    return this.healthService.getStatus();
  }
}
