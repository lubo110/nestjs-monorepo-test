import { Module } from '@nestjs/common'
import { JpushGateway } from './jpush.gateway'
import { JPushService } from './jpush.service'

@Module({
  providers: [JPushService, JpushGateway],
})
export class JpushModule {}
