import { Module, Global } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
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
  ],
})
export class AuthModule {}
