import { Module } from '@nestjs/common'
import { OccupationsController } from './occupations.controller'
import { OccupationsService } from './occupations.service'

@Module({
  controllers: [OccupationsController],
  providers: [OccupationsService],
  exports: [OccupationsService],
})
export class OccupationsModule {}
