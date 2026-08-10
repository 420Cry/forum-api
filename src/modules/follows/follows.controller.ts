import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { AuthUser, RequestWithUser } from '../auth/auth.types'
import { RequiresOnboarded } from '../users/decorators/requires-onboarded.decorator'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { FollowDto } from './dto/follow.dto'
import { followTargetTypes } from './follows.type'
import { FollowsService } from './follows.service'

@Controller()
@UseGuards(OnboardingStateGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('follows')
  @RequiresOnboarded()
  follow(@Body() dto: FollowDto, @Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.followsService.follow(id, dto)
  }

  @Delete('follows')
  @RequiresOnboarded()
  unfollow(@Body() dto: FollowDto, @Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.followsService.unfollow(id, dto)
  }

  @Get('follows/me')
  @RequiresOnboarded()
  listMyFollowing(@Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.followsService.listFollowing(id)
  }

  @Get('follows/followers')
  @RequiresOnboarded()
  listFollowers(
    @Query('targetType') targetType: (typeof followTargetTypes)[number],
    @Query('targetId') targetId: string,
  ) {
    if (!followTargetTypes.includes(targetType)) {
      throw new BadRequestException('Invalid targetType')
    }
    if (!targetId?.trim()) {
      throw new BadRequestException('targetId is required')
    }
    return this.followsService.listFollowers(targetType, targetId)
  }

  @Get('follows/following')
  @RequiresOnboarded()
  listFollowing(@Query('userId') userId: string) {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required')
    }
    return this.followsService.listFollowingForUser(userId)
  }

  @Get('follows/status')
  @RequiresOnboarded()
  status(
    @Query('targetType') targetType: (typeof followTargetTypes)[number],
    @Query('targetId') targetId: string,
    @Req() req: RequestWithUser,
  ) {
    const { id } = req.user as AuthUser
    return this.followsService.isFollowing(id, targetType, targetId)
  }
}
