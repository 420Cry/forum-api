import { Module } from '@nestjs/common'
import { EnvModule } from '../../config/config.module'
import { FollowsModule } from '../follows/follows.module'
import { UsersModule } from '../users/users.module'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { SendbirdClient } from './sendbird.client'

@Module({
  imports: [EnvModule, UsersModule, FollowsModule],
  controllers: [ChatController],
  providers: [ChatService, SendbirdClient],
  exports: [ChatService],
})
export class ChatModule {}
