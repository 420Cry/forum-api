import { Module, Global } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { EmailVerifiedGuard } from './email-verified.guard'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { SupabaseService } from './supabase.service'

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerifiedGuard,
    },
  ],
})
export class AuthModule {}
