import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../auth/public.decorator'
import type { AuthUser, RequestWithUser } from '../auth/auth.types'
import { RequiresOnboarded } from '../users/decorators/requires-onboarded.decorator'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import {
  CreateInvestorProfileDto,
  UpdateInvestorProfileDto,
} from './dto/create-investor-profile.dto'
import {
  CreateStartupProfileDto,
  UpdateStartupProfileDto,
} from './dto/create-startup-profile.dto'
import { ProfilesService } from './profiles.service'

@Controller()
@UseGuards(OnboardingStateGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me/accounts')
  @RequiresOnboarded()
  listAccounts(@Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.profilesService.listAccounts(id)
  }

  @Post('profiles/startup')
  @RequiresOnboarded()
  createStartup(
    @Body() dto: CreateStartupProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    return this.profilesService.createStartup(id, dto)
  }

  @Patch('profiles/startup')
  @RequiresOnboarded()
  updateStartup(
    @Body() dto: UpdateStartupProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    return this.profilesService.updateStartup(id, dto)
  }

  @Public()
  @Get('profiles/startup/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  getStartup(@Param('id', ParseUUIDPipe) id: string) {
    return this.profilesService.getStartup(id)
  }

  @Post('profiles/investor')
  @RequiresOnboarded()
  createInvestor(
    @Body() dto: CreateInvestorProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    return this.profilesService.createInvestor(id, dto)
  }

  @Patch('profiles/investor')
  @RequiresOnboarded()
  updateInvestor(
    @Body() dto: UpdateInvestorProfileDto,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    return this.profilesService.updateInvestor(id, dto)
  }

  @Public()
  @Get('profiles/investor/:id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  getInvestor(@Param('id', ParseUUIDPipe) id: string) {
    return this.profilesService.getInvestor(id)
  }

  @Public()
  @Get('profiles/user/:urlKeyOrId')
  getPublicUser(@Param('urlKeyOrId') urlKeyOrId: string) {
    return this.profilesService.getPublicUser(urlKeyOrId)
  }

  @Get('find')
  @RequiresOnboarded()
  find(
    @Req() req: RequestWithUser,
    @Query('q') q?: string,
    @Query('type') type?: 'user' | 'startup' | 'investor' | 'all',
    @Query('industry') industry?: string,
    @Query('stage') stage?: string,
    @Query('location') location?: string,
    @Query('occupation') occupation?: string,
    @Query('role') role?: string,
    @Query('sort') sort?: 'newest' | 'name',
    @Query('limit') limit?: string,
  ) {
    const { id } = req.user as AuthUser
    return this.profilesService.search(id, {
      q,
      type,
      industry,
      stage,
      location,
      occupation,
      role,
      sort,
      limit: limit ? Number(limit) : undefined,
    })
  }
}
