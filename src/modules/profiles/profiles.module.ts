import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StartupProfiles } from './entities/startup-profiles.entity'
import { InvestorProfiles } from './entities/investor-profiles.entity'
import { UsersModule } from '../users/users.module'
import { ProfileController } from './profiles.controller'

@Module({
  providers: [],
  imports: [
    TypeOrmModule.forFeature([StartupProfiles, InvestorProfiles]),
    UsersModule,
  ],
  controllers: [ProfileController],
  exports: [],
})
export class ProfilesModule {}
