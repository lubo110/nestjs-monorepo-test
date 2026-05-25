import { HttpStatus, Injectable } from '@nestjs/common'
import { OrderService } from '../../order/service'
import { WechatPayService } from '../../payment/wechat/service/wechat.service'
import { PaymentMethod, WaffleRequestStatus } from '../../shared/enums/common.enum'
import { ApiException } from '../../shared/exceptions/api.exception'

import { PaymentResultAssembler } from '../assemblers/payment_result.assembler'
import { CreateOrderDTO } from '../dto'
import { PaymentGateway } from './payment.gateway'
import { PaymentGatewayRegistry } from './payment.gateway.registry'

@Injectable()
export class WechatGateway extends PaymentGateway {
  public readonly provider = PaymentMethod.WECHAT

  constructor(
    private readonly orderService: OrderService,
    private readonly wechatPayService: WechatPayService,
    registry: PaymentGatewayRegistry,
    private readonly paymentResultAssembler: PaymentResultAssembler,
  ) {
    super(registry)
  }

  async createPayment(body: CreateOrderDTO, userId: string) {
    const order = await this.orderService.createOrder(body.product_id, userId)
    try {
      const data = await this.wechatPayService.createAppPrepayOrder({
        outTradeNo: order.order_id,
        description: order.product_name,
        amount: order.total_amount,
      })

      return {
        ...data,
        order_id: order.order_id,
      }
    }
    catch (err) {
      await this.orderService.markOrderFailed(order.order_id)
      throw err
    }
  }

  async closePayment(orderId: string) {
    await this.wechatPayService.cancelOrder(orderId)
    return await this.orderService.markOrderClosed(orderId)
  }

  async confirmPayment(orderId: string) {
    const data = await this.wechatPayService.getOrderStatus(orderId)
    if (data.trade_state !== 'SUCCESS') {
      throw new ApiException(
        data.trade_state_desc || '支付未完成',
        WaffleRequestStatus.ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const order = await this.orderService.handlePaymentSuccess(orderId, {
      transaction_id: data.transaction_id,
      total_amount: data.amount.total,
      pay_amount: data.amount.payer_total,
      currency: data.amount.currency,
      trade_state_desc: data.trade_state_desc,
      trade_type: data.trade_type,
      pay_time: new Date(data.success_time),
      pay_type: PaymentMethod.WECHAT,
    })
    if (!order) {
      throw new ApiException(
        `订单[${orderId}]不存在或支付状态异常`,
        WaffleRequestStatus.ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    return this.paymentResultAssembler.build(order)
  }
}
