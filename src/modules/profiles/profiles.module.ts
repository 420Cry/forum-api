import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from '../users/users.module'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { InvestorProfiles } from './entities/investor-profiles.entity'
import { StartupProfiles } from './entities/startup-profiles.entity'
import { ProfilesController } from './profiles.controller'
import { ProfilesService } from './profiles.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([StartupProfiles, InvestorProfiles]),
    UsersModule,
  ],
  providers: [ProfilesService, OnboardingStateGuard],
  controllers: [ProfilesController],
  exports: [ProfilesService],
})
export class ProfilesModule {}
