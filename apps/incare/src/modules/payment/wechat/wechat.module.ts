import { HttpModule } from '@nestjs/axios'

import { Module } from '@nestjs/common'
import { WechatPayCryptoService, WechatPayHttpService, WechatPayService } from './service'

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.mch.weixin.qq.com',
      headers: {
        Accept: 'application/json',
      },
      timeout: 10000,
    }),
  ],
  providers: [
    WechatPayService,
    WechatPayCryptoService,
    WechatPayHttpService,
  ],
  exports: [WechatPayService],
})
export class WechatPayModule {}
