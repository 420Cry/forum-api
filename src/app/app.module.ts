import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from '../modules/auth'
import { HealthModule } from '../modules/health'
import { RootModule } from '../modules/root'
import { EnvModule } from '../config/config.module'
import { DatabaseModule } from '../database/database.module'
import { UsersModule } from 'src/modules/users/users.module'
import { TagsModule } from 'src/modules/tags/tags.module'
import { FiltersModule } from 'src/filters/filters.module'
import { ProfilesModule } from 'src/modules/profiles/profiles.module'
import { PostsModule } from 'src/modules/posts/posts.module'
import { ReactionsModule } from 'src/modules/reactions/reactions.module'
import { FollowsModule } from 'src/modules/follows/follows.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : ['.env', '.env.local'],
    }),
    EnvModule,
    FiltersModule,
    DatabaseModule,
    AuthModule,
    RootModule,
    HealthModule,
    UsersModule,
    TagsModule,
    ProfilesModule,
    PostsModule,
    ReactionsModule,
    FollowsModule,
  ],
})
export class AppModule {}
