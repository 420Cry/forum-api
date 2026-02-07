import { Controller, Get, Inject } from '@nestjs/common';
import { ROOT_SERVICE, RootServiceToken } from './root.service.interface';

@Controller()
export class RootController {
  constructor(
    @Inject(ROOT_SERVICE) private readonly rootService: RootServiceToken,
  ) {}

  @Get()
  getHello(): string {
    return this.rootService.getHello();
  }
}
