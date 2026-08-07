import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StartupProfiles } from './entities/startup-profiles.entity'
import { InvestorProfiles } from './entities/investor-profiles.entity'

@Module({
  providers: [],
  imports: [TypeOrmModule.forFeature([StartupProfiles, InvestorProfiles])],
  controllers: [],
  exports: [],
})
export class ProfilesModule {}
