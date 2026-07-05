import { Module } from '@nestjs/common'
import { AuthModule } from '../modules/auth'
import { HealthModule } from '../modules/health'
import { RootModule } from '../modules/root'

@Module({
  imports: [AuthModule, RootModule, HealthModule],
})
export class AppModule {}
