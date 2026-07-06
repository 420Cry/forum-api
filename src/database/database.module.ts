import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvModule } from '../config/config.module'
import { EnvService } from '../config/config.service'

@Module({
  imports: [
    EnvModule,
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (env: EnvService) => env.getDBConfig(),
      inject: [EnvService],
    }),
  ],
})
export class DatabaseModule {}
