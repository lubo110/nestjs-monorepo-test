import { Controller, Headers, HttpStatus, Post, RawBodyRequest, Req, Res, UseInterceptors } from '@nestjs/common'
import { Response } from 'express'
import { Public } from '@incare/modules/shared/decorators/public.decorator'
import { LoggerInterceptor } from '@incare/modules/shared/interceptors/logger.interceptor'
import { PaymentNotifyService } from '../service/payment_notify.service'

@UseInterceptors(LoggerInterceptor)
@Controller('payments/notify')
export class PaymentNotifyController {
  constructor(private readonly paymentNotifyService: PaymentNotifyService) { }
  @Public()
  @Post('wechat')
  async handleWechatNotify(
        @Res() res: Response,
        @Req() req: RawBodyRequest<Request>, // 获取原始请求体
        @Headers('Wechatpay-Signature') signature: string,
        @Headers('Wechatpay-Nonce') nonce: string,
        @Headers('Wechatpay-Timestamp') timestamp: string,
        @Headers('Wechatpay-Serial') serial: string,
  ) {
    try {
      const rawBody = req.rawBody.toString()
      const isValid = this.paymentNotifyService.verifyWechatNotify({
        signature,
        timestamp,
        nonce,
        rawBody,
        serial,
      })
      if (!isValid) {
        return res.status(HttpStatus.FORBIDDEN).send({
          code: 'FAIL',
          message: '签名验证失败',
        }) // 失败应答
      }

      await this.paymentNotifyService.handleWechatNotify(rawBody)
      res.status(HttpStatus.OK).send()
    }
    catch (error) {
      // 返回失败响应
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 'FAIL',
        message: error.message || '服务器处理失败',
      })
    }
  }
}
