import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return { status: 'ok' as const, timestamp: new Date().toISOString() };
  }
}
