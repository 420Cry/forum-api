import { Module } from '@nestjs/common'
import { EnvModule } from 'src/config/config.module'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { UsersModule } from '../users/users.module'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { SendbirdClient } from './sendbird.client'

@Module({
  imports: [EnvModule, UsersModule],
  controllers: [ChatController],
  providers: [ChatService, SendbirdClient, OnboardingStateGuard],
  exports: [ChatService],
})
export class ChatModule {}
