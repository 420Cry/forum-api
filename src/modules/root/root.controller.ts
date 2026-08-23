import { Controller, Get, Inject } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from '../auth'
import { ROOT_SERVICE, RootServiceToken } from './root.service.interface'

@Controller()
@Public()
@SkipThrottle()
export class RootController {
  constructor(
    @Inject(ROOT_SERVICE) private readonly rootService: RootServiceToken,
  ) {}

  @Get()
  getHello(): string {
    return this.rootService.getHello()
  }
}
