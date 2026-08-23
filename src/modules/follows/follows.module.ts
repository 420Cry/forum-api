import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LocationsModule } from '../locations/locations.module'
import { InvestorProfiles } from '../profiles/entities/investor-profiles.entity'
import { StartupProfiles } from '../profiles/entities/startup-profiles.entity'
import { ProfilesModule } from '../profiles/profiles.module'
import { TagsModule } from '../tags/tags.module'
import { OnboardingStateGuard } from '../users/guards/onboarding-state.guard'
import { UsersModule } from '../users/users.module'
import { Follows } from './entities/follows.entity'
import { FollowsController } from './follows.controller'
import { FollowsService } from './follows.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Follows, StartupProfiles, InvestorProfiles]),
    ProfilesModule,
    UsersModule,
    LocationsModule,
    TagsModule,
  ],
  controllers: [FollowsController],
  providers: [FollowsService, OnboardingStateGuard],
  exports: [FollowsService],
})
export class FollowsModule {}
