import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Reactions } from '../reactions/entities/reactions.entity'
import { UsersModule } from '../users/users.module'
import { Posts } from './entities/posts.entity'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'

@Module({
  imports: [TypeOrmModule.forFeature([Posts, Reactions]), UsersModule],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
