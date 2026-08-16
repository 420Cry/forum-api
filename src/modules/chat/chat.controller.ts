import { Throttle } from '@nestjs/throttler'
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import type { AuthUser, RequestWithUser } from '../auth/auth.types'
import { RequiresOnboarded } from '../users/decorators/requires-onboarded.decorator'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { ChatService } from './chat.service'
import { OpenChannelDto } from './dto/open-channel.dto'

@Controller('chat')
@UseGuards(OnboardingStateGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('session')
  @RequiresOnboarded()
  getSession(@Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.chatService.getSession(id)
  }

  @Post('channels')
  @RequiresOnboarded()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  openChannel(@Body() dto: OpenChannelDto, @Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.chatService.openChannel(id, dto.userId)
  }

  @Get('unread')
  @RequiresOnboarded()
  unread(@Req() req: RequestWithUser) {
    const { id } = req.user as AuthUser
    return this.chatService.getUnread(id)
  }
}
