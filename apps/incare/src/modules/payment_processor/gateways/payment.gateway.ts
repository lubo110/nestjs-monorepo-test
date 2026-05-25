import type { Order } from '../../order/order.schema'
import { Logger, OnModuleInit } from '@nestjs/common'
import { PaymentMethod } from '../../shared/enums/common.enum'
import { CreateOrderDTO } from '../dto'
import { ConfirmPaymentResult } from '../types'
import { PaymentGatewayRegistry } from './payment.gateway.registry'

export abstract class PaymentGateway implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name)

  /** 网关标识，应由具体实现提供 */
  abstract readonly provider: PaymentMethod
  /**
   * 创建支付（预下单）
   */
  abstract createPayment(body: CreateOrderDTO, userId: string): Promise<any>
  /**
   * 主动确认并同步支付结果（查询第三方）
   */
  abstract confirmPayment(orderId: string): Promise<ConfirmPaymentResult | null>
  /**
   * 关闭支付订单（未支付）
   */
  abstract closePayment(orderId: string): Promise<Order | null>

  protected constructor(protected readonly registry: PaymentGatewayRegistry) {}
  onModuleInit() {
    this.registry.register(this)
  }
}
