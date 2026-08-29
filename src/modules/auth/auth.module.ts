import { Module, Global } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { EnvModule } from '../../config/config.module'
import { UsersModule } from '../users/users.module'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { AuthController } from './auth.controller'
import { EmailVerifiedGuard } from './email-verified.guard'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { SupabaseService } from './supabase.service'

@Global()
@Module({
  imports: [UsersModule, EnvModule],
  controllers: [AuthController],
  providers: [
    SupabaseService,
    OnboardingStateGuard,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerifiedGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OnboardingStateGuard,
    },
  ],
  exports: [SupabaseService],
})
export class AuthModule {}
