import { Controller, Get, UseGuards } from '@nestjs/common'
import { RolesGuard } from './guards/roles.guard'
import { Roles } from './decorators/roles.decorator'

@Controller('profile')
@UseGuards(RolesGuard)
export class ProfileController {
  constructor() {}

  @Get('test')
  @Roles('Founder')
  testStartupRoute() {
    return { success: true, message: 'Startup can access this route' }
  }
}
