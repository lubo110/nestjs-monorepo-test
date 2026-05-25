import { Module } from '@nestjs/common'
import { WechatPayModule } from './wechat/wechat.module'

@Module({
  imports: [WechatPayModule],
  exports: [WechatPayModule],
})
export class PaymentModule {}
