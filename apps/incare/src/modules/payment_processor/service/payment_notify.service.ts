import { PaymentMethod } from '@incare/modules/shared/enums/common.enum'
import { Injectable, Logger } from '@nestjs/common'
import { OrderService } from '../../order/service'
import { WechatPayService } from '../../payment/wechat/service/wechat.service'
import { WechatVerifyParams } from '../types'

@Injectable()
export class PaymentNotifyService {
  private readonly logger = new Logger(PaymentNotifyService.name)
  constructor(
    private readonly orderService: OrderService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  verifyWechatNotify(payload: WechatVerifyParams) {
    const { nonce, timestamp, signature, rawBody } = payload
    this.logger.log(`[payNotify] 微信支付成功回调验签数据，timestamp：${timestamp} nonce：${nonce} signature:${signature} rawBody:${rawBody}`)
    return this.wechatPayService.verifyNotifySignature(timestamp, nonce, signature, rawBody)
  }

  async handleWechatNotify(rawBody: string) {
    const payResult = this.wechatPayService.decryptNotify(rawBody)
    await this.orderService.handlePaymentSuccess(payResult.out_trade_no, {
      transaction_id: payResult.transaction_id,
      total_amount: payResult.amount.total,
      pay_amount: payResult.amount.payer_total,
      currency: payResult.amount.currency,
      trade_state_desc: payResult.trade_state_desc,
      trade_type: payResult.trade_type,
      pay_time: new Date(payResult.success_time),
      pay_type: PaymentMethod.WECHAT,
    })
  }
}
