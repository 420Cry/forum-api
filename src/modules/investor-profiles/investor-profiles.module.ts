import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InvestorProfiles } from './entities/investor-profiles.entity'

@Module({
  imports: [TypeOrmModule.forFeature([InvestorProfiles])],
  providers: [],
  exports: [],
  controllers: [],
})
export class InvestorProfilesModule {}
