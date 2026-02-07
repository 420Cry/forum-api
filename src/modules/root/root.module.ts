import { Module } from '@nestjs/common';
import { RootController } from './root.controller';
import { RootService } from './root.service';
import { ROOT_SERVICE } from './root.service.interface';

@Module({
  controllers: [RootController],
  providers: [
    {
      provide: ROOT_SERVICE,
      useClass: RootService,
    },
  ],
})
export class RootModule {}
