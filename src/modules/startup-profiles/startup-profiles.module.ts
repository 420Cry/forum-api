import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StartupProfiles } from './entities/startup-profiles.entity'

@Module({
  imports: [TypeOrmModule.forFeature([StartupProfiles])],
  providers: [],
  controllers: [],
})
export class StartupProfilesModule {}
