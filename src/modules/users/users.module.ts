import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities';
import { UserOnboardingService } from './onboarding/users_onboarding.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserOnboardingService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
