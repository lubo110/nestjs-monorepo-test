import type { Order } from '../../order/order.schema'
import { formatDate } from '@incare/modules/shared/utils/util'
import { Injectable } from '@nestjs/common'
import { ConfirmPaymentResult } from '../types/confirm_payment_result.interface'
import { getStatus } from '../utils/payment-result.utils'

@Injectable()
export class PaymentResultAssembler {
  build(order: Order) {
    return {
      order_id: order.order_id,
      product_name: order.product_name,
      product_id: order.product_id,
      create_time: formatDate(order.create_time),
      pay_time: formatDate(order.pay_time),
      expire_time: `${formatDate(order?.start_time)}至${formatDate(order?.end_time)}`,
      amount: order.pay_amount / 100,
      status: getStatus(order?.end_time),
      pay_type: order.pay_type,
    } as ConfirmPaymentResult
  }
}
