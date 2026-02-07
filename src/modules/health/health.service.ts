import { Injectable } from '@nestjs/common';
import { HealthServiceToken } from './health.service.interface';

@Injectable()
export class HealthService extends HealthServiceToken {
  getStatus(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
