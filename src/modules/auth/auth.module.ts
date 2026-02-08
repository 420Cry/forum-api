import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseService } from './firebase.service';
import { UsersModule } from '../users';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    FirebaseService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [FirebaseService],
})
export class AuthModule {}
