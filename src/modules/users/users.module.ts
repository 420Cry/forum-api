import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserInfo } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserInfo])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
