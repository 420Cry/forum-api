import { Injectable } from '@nestjs/common';
import { RootServiceToken } from './root.service.interface';

@Injectable()
export class RootService extends RootServiceToken {
  getHello(): string {
    return 'Hello World!';
  }
}
