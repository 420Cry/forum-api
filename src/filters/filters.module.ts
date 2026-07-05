import { Module } from '@nestjs/common'
import { CustomHttpExceptionFilter } from './custom-http-exception.filter'
import { APP_FILTER } from '@nestjs/core'

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: CustomHttpExceptionFilter,
    },
  ],
})
export class FiltersModule {}
