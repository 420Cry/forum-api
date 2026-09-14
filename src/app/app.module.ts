import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from '../modules/auth'
import { HealthModule } from '../modules/health'
import { RootModule } from '../modules/root'
import { EnvModule } from '../config/config.module'
import { DatabaseModule } from '../database/database.module'
import { UsersModule } from '../modules/users/users.module'
import { TagsModule } from '../modules/tags/tags.module'
import { LocationsModule } from '../modules/locations/locations.module'
import { OccupationsModule } from '../modules/occupations/occupations.module'
import { FiltersModule } from '../filters/filters.module'
import { ProfilesModule } from '../modules/profiles/profiles.module'
import { FollowsModule } from '../modules/follows/follows.module'
import { ChatModule } from '../modules/chat/chat.module'
import { PostsModule } from '../modules/posts/posts.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    EnvModule,
    FiltersModule,
    DatabaseModule,
    AuthModule,
    RootModule,
    HealthModule,
    UsersModule,
    TagsModule,
    LocationsModule,
    OccupationsModule,
    ProfilesModule,
    FollowsModule,
    ChatModule,
    PostsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
