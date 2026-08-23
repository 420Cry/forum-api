import { Module } from '@nestjs/common'
import { EnvModule } from 'src/config/config.module'
import { FollowsModule } from '../follows/follows.module'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { UsersModule } from '../users/users.module'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { SendbirdClient } from './sendbird.client'

@Module({
  imports: [EnvModule, UsersModule, FollowsModule],
  controllers: [ChatController],
  providers: [ChatService, SendbirdClient, OnboardingStateGuard],
  exports: [ChatService],
})
export class ChatModule {}
