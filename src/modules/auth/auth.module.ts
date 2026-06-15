import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseService } from './supabase.service';
import { UsersModule } from '../users';

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
  exports: [SupabaseService],
})
export class AuthModule {}
