import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities';
import { UserOnboardingService } from './onboarding/users-onboarding.service';
import { UsersController } from './users.controller';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), TagsModule],
  providers: [UsersService, UserOnboardingService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
