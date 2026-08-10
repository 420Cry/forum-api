import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CatalogController } from './catalog.controller'
import { Tag } from './entities/tags.entities'
import { TagsService } from './tags.service'

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  controllers: [CatalogController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
