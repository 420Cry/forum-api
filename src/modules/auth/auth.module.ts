import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { FirebaseService } from './firebase.service';
import { UsersModule } from '../users';
import { FirebaseSessionAuthGuard } from './firebase-session-auth.guard';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    FirebaseService,
    {
      provide: APP_GUARD,
      useClass: FirebaseSessionAuthGuard,
    },
  ],
  exports: [FirebaseService],
})
export class AuthModule {}
