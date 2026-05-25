import { Injectable } from '@nestjs/common'
import { PaymentMethod } from '../../shared/enums/common.enum'
import { CloseOrderDTO, CreateOrderDTO, QueryOrderDTO } from '../dto'
import { PaymentGateway, PaymentGatewayRegistry } from '../gateways'
import { QueryUserPaymentsService } from './query_user_payments.service'

@Injectable()
export class PaymentProcessorService {
  constructor(
    private registry: PaymentGatewayRegistry,
    private readonly queryUserPaymentsService: QueryUserPaymentsService,
  ) { }

  createPayment(body: CreateOrderDTO, userId: string) {
    const gateway = this.getGateway(body.pay_type)
    return gateway.createPayment(body, userId)
  }

  async closePayment(body: CloseOrderDTO) {
    const gateway = this.getGateway(body.pay_type)
    return gateway.closePayment(body.order_id)
  }

  confirmPayment(body: QueryOrderDTO) {
    const gateway = this.getGateway(body.pay_type)
    return gateway.confirmPayment(body.order_id)
  }

  /** 查询用户支付记录 */
  queryUserPayments(userId: string) {
    return this.queryUserPaymentsService.execute(userId)
  }

  private getGateway(method: PaymentMethod): PaymentGateway {
    return this.registry.get(method)
  }
}
