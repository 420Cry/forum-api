import { Controller, Get, Inject } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from '../auth'
import { HEALTH_SERVICE, HealthServiceToken } from './health.service.interface'

@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
  constructor(
    @Inject(HEALTH_SERVICE) private readonly healthService: HealthServiceToken,
  ) {}

  @Get()
  getHealth() {
    return this.healthService.getStatus()
  }
}
