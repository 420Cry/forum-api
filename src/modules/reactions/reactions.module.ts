import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Reactions } from './entities/reactions.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Reactions])],
  providers: [],
  controllers: [],
  exports: [],
})
export class ReactionsModule {}
